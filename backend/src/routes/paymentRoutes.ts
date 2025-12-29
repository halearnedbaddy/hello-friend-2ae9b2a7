import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { mpesaService } from '../services/mpesaService';
import { smsService } from '../services/smsService';
import { prisma } from '../config/database';
import { io } from '../index';

const router = Router();

/**
 * POST /api/v1/payments/initiate-stk
 * Initiate STK Push for buyer payment
 */
router.post('/initiate-stk', authenticate, async (req, res) => {
  try {
    const { transactionId, phoneNumber, amount } = req.body;

    if (!transactionId || !phoneNumber || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: transactionId, phoneNumber, amount',
      });
    }

    // Get transaction details
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { seller: true, buyer: true },
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found',
      });
    }

    // Initiate STK Push
    const stkResponse = await mpesaService.initiateSTKPush(
      phoneNumber,
      amount,
      transactionId,
      req.user?.name || 'Buyer'
    );

    // Store checkout request ID
    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        checkoutRequestId: stkResponse.CheckoutRequestID,
        status: 'PAYMENT_PENDING',
      },
    });

    res.json({
      success: true,
      data: {
        checkoutRequestID: stkResponse.CheckoutRequestID,
        merchantRequestID: stkResponse.MerchantRequestID,
        message: stkResponse.CustomerMessage,
      },
    });
  } catch (error) {
    console.error('❌ STK Push error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to initiate payment',
    });
  }
});

/**
 * POST /api/v1/payments/mpesa-callback
 * M-Pesa Daraja callback webhook
 */
router.post('/mpesa-callback', async (req, res) => {
  try {
    const { Body } = req.body;

    if (!Body?.stkCallback) {
      console.warn('⚠️  Invalid callback format');
      return res.json({ ResultCode: 1 });
    }

    const { ResultCode, CheckoutRequestID, CallbackMetadata } = Body.stkCallback;

    // Find transaction by checkout request ID
    const transaction = await prisma.transaction.findFirst({
      where: { checkoutRequestId: CheckoutRequestID },
      include: { buyer: true, seller: true },
    });

    if (!transaction) {
      console.error('❌ Transaction not found for callback:', CheckoutRequestID);
      return res.json({ ResultCode: 1 });
    }

    if (ResultCode === 0) {
      // Payment successful
      const mpesaCode = CallbackMetadata.Item.find((item: { Name: string }) => item.Name === 'MpesaReceiptNumber')?.Value;
      const amount = CallbackMetadata.Item.find((item: { Name: string }) => item.Name === 'Amount')?.Value;

      // Update transaction status
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'PAYMENT_CONFIRMED',
          mpesaReceiptNumber: mpesaCode,
          paidAmount: amount,
          paidAt: new Date(),
        },
      });

      // Send SMS to seller - funds secured
      if (transaction.seller?.phone) {
        await smsService.sendPaymentConfirmationSMS(
          transaction.seller.phone,
          amount,
          transaction.buyer?.name || 'Buyer'
        );
      }

      // Emit WebSocket notification
      io.to(`user:${transaction.sellerId}`).emit('notification:new', {
        id: `payment-${transaction.id}`,
        type: 'PAYMENT',
        title: 'Payment Received',
        message: `KES ${amount} payment secured for order. Ready to ship!`,
        timestamp: new Date().toISOString(),
      });

      console.log('✅ Payment confirmed for transaction:', transaction.id);
    } else {
      // Payment failed
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'PAYMENT_FAILED' },
      });

      console.log('❌ Payment failed for transaction:', transaction.id);
    }

    res.json({ ResultCode: 0 });
  } catch (error) {
    console.error('❌ Callback processing error:', error);
    res.json({ ResultCode: 1 });
  }
});

/**
 * POST /api/v1/payments/confirm-delivery
 * Confirm delivery and release funds to seller
 */
router.post('/confirm-delivery', authenticate, async (req, res) => {
  try {
    const { transactionId, deliveryOTP } = req.body;

    if (!transactionId || !deliveryOTP) {
      return res.status(400).json({
        success: false,
        error: 'Missing transactionId or deliveryOTP',
      });
    }

    // Get transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { buyer: true, seller: true },
    });

    if (!transaction) {
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    }

    // Verify OTP (in production, verify against stored OTP)
    if (deliveryOTP !== '1234') {
      // Demo: hardcoded OTP
      return res.status(401).json({ success: false, error: 'Invalid OTP' });
    }

    // Release funds via B2C
    const b2cResponse = await mpesaService.releaseSellerFunds(
      transaction.seller!.phone,
      transaction.amount,
      transactionId
    );

    // Update transaction
    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        b2cRequestId: b2cResponse.ConversationID,
      },
    });

    // Send SMS to seller - funds released
    if (transaction.seller?.phone) {
      await smsService.sendPaymentReleasedSMS(transaction.seller.phone, transaction.amount);
    }

    // Emit WebSocket notification
    io.to(`user:${transaction.sellerId}`).emit('notification:new', {
      id: `completed-${transaction.id}`,
      type: 'ORDER_STATUS',
      title: 'Payment Released',
      message: `KES ${transaction.amount} has been released to your M-Pesa account`,
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      data: { conversationID: b2cResponse.ConversationID },
    });
  } catch (error) {
    console.error('❌ Delivery confirmation error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to confirm delivery',
    });
  }
});

/**
 * POST /api/v1/payments/check-status
 * Check payment status
 */
router.post('/check-status', authenticate, async (req, res) => {
  try {
    const { transactionId } = req.body;

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    }

    res.json({
      success: true,
      data: {
        status: transaction.status,
        amount: transaction.amount,
        createdAt: transaction.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to check payment status' });
  }
});

export default router;
