'use server'

import { prisma } from '@/lib/prisma'

export async function getFinancialData() {
  try {
    // 1. Get all wallets
    const wallets = await prisma.wallet.findMany({
      include: {
        user: {
          select: { name: true, email: true, role: true }
        }
      }
    });

    // 2. Get recent transactions (Jobs with successful payments)
    const transactions = await prisma.job.findMany({
      where: {
        payment: { status: 'SUCCESS' }
      },
      include: {
        client: { select: { name: true } },
        worker: { 
          select: { 
            name: true,
            workerProfile: { select: { businessName: true } }
          } 
        },
        payment: true
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    // 3. System totals
    const totalVolume = transactions.reduce((sum, job) => sum + (job.priceAmount || 0), 0);
    const platformCommission = totalVolume * 0.05;

    return { 
      success: true, 
      data: { 
        wallets, 
        transactions,
        stats: {
          totalVolume,
          platformCommission,
          activeWallets: wallets.length
        }
      } 
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
