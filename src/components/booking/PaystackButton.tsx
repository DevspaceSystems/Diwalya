'use client';

import React from 'react';
import { usePaystackPayment } from 'react-paystack';
import { Loader2 } from 'lucide-react';

interface PaystackButtonProps {
    email: string;
    amount: number;
    metadata: any;
    onSuccess: (reference: any) => void;
    onClose: () => void;
    loading: boolean;
}

export default function PaystackButton({ email, amount, metadata, onSuccess, onClose, loading }: PaystackButtonProps) {
    const config = {
        reference: (new Date()).getTime().toString(),
        email: email,
        amount: amount,
        publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '',
        currency: 'GHS',
        channels: ['card', 'mobile_money'],
        metadata
    };

    const initializePayment = usePaystackPayment(config);

    return (
        <button 
            onClick={() => {
                // @ts-ignore
                initializePayment(onSuccess, onClose);
            }}
            disabled={loading}
            className="w-full bg-secondary text-white py-5 rounded-2xl font-black text-xl flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 hover:scale-[1.01] transition-all disabled:opacity-50"
        >
            {loading ? <Loader2 className="animate-spin" /> : <>Pay with Card / MoMo</>}
        </button>
    );
}
