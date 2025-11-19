import * as Dialog from "@radix-ui/react-dialog";
import MpCardForm from "./MpCardForm";
import { X } from "lucide-react";

interface PaymentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    amount: number;
    onSubmit: (formData: any) => Promise<void>;
    error?: string | null;
}

export default function PaymentDialog({ open, onOpenChange, amount, onSubmit, error }: PaymentDialogProps) {
    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
                <Dialog.Content className="fixed inset-0 flex items-center justify-center p-4 z-[60]">
                    <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden relative">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="font-semibold text-lg">Pago Seguro</h3>
                            <button onClick={() => onOpenChange(false)} className="p-1 hover:bg-gray-100 rounded-full">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="p-6">
                            <p className="text-sm text-gray-600 mb-4">
                                Total a pagar: <span className="font-bold text-black">${amount.toLocaleString("es-CL")}</span>
                            </p>
                            <p className="text-xs text-gray-500 mb-6 bg-blue-50 text-blue-700 p-3 rounded-lg">
                                <span className="font-semibold">Nota:</span> El dinero solo se descontará de tu cuenta una vez que se confirme el partido (mínimo de jugadores alcanzado).
                            </p>

                            {error && (
                                <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                                    {error}
                                </div>
                            )}

                            <MpCardForm
                                amount={amount}
                                onSubmit={onSubmit}
                                onError={(e) => console.error(e)}
                            />
                        </div>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
