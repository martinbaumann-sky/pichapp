import { useEffect, useRef, useState } from "react";
import Script from "next/script";

declare global {
    interface Window {
        MercadoPago: any;
    }
}

interface MpCardFormProps {
    amount: number;
    onSubmit: (formData: any) => Promise<void>;
    onError: (error: any) => void;
}

export default function MpCardForm({ amount, onSubmit, onError }: MpCardFormProps) {
    const brickController = useRef<any>(null);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        if (loaded && window.MercadoPago) {
            initBrick();
        }
    }, [loaded]);

    const initBrick = async () => {
        if (brickController.current) return;

        const publicKey = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY;
        if (!publicKey) {
            onError(new Error("Falta la clave pública de Mercado Pago (NEXT_PUBLIC_MP_PUBLIC_KEY)"));
            return;
        }

        const mp = new window.MercadoPago(publicKey, {
            locale: "es-CL",
        });

        const bricksBuilder = mp.bricks();

        const settings = {
            initialization: {
                amount: amount,
            },
            customization: {
                paymentMethods: {
                    minInstallments: 1,
                    maxInstallments: 1,
                },
                visual: {
                    style: {
                        theme: "default",
                    },
                },
            },
            callbacks: {
                onReady: () => {
                    // handle form ready
                },
                onSubmit: async (cardFormData: any) => {
                    await onSubmit(cardFormData);
                },
                onError: (error: any) => {
                    onError(error);
                },
            },
        };

        try {
            brickController.current = await bricksBuilder.create("cardPayment", "mp-card-form-container", settings);
        } catch (e) {
            onError(e);
        }
    };

    return (
        <>
            <Script
                src="https://sdk.mercadopago.com/js/v2"
                onLoad={() => setLoaded(true)}
            />
            <div id="mp-card-form-container" />
        </>
    );
}
