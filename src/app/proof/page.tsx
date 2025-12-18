'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Upload, CheckCircle, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { triggerConfettiFireworks } from '@/components/magicui/confetti';

export default function ProofUploadPage() {
    const router = useRouter();
    const [userData, setUserData] = useState<any>(null);
    const [uploading, setUploading] = useState(false);
    const [showCelebration, setShowCelebration] = useState(false);

    useEffect(() => {
        const storedData = sessionStorage.getItem('userData');
        if (!storedData) {
            router.push('/');
            return;
        }
        const data = JSON.parse(storedData);
        setUserData(data);
    }, [router]);

    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        if (!e.target.files?.[0] || !userData) return;
        setUploading(true);
        const formData = new FormData();
        formData.append('file', e.target.files[0]);
        formData.append('userId', userData.id);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();
            if (data.success) {
                const updated = { ...userData, proofImage: data.path };
                setUserData(updated);
                sessionStorage.setItem('userData', JSON.stringify(updated));
                setShowCelebration(true);
                // Trigger MagicUI fireworks confetti
                triggerConfettiFireworks();
            }
        } catch (error) {
            console.error('Upload failed', error);
        } finally {
            setUploading(false);
        }
    }

    if (!userData) {
        return null;
    }

    return (
        <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-background relative overflow-hidden text-foreground">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-background to-background pointer-events-none" />

            <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                {[...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute bg-white rounded-full opacity-20 animate-snow"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `-${Math.random() * 20}%`,
                            width: `${Math.random() * 4 + 2}px`,
                            height: `${Math.random() * 4 + 2}px`,
                            animationDelay: `${Math.random() * 5}s`,
                            animationDuration: `${Math.random() * 5 + 5}s`
                        }}
                    />
                ))}
            </div>

            <div className="z-10 w-full max-w-md space-y-6">
                {!showCelebration && (
                    <Button
                        variant="ghost"
                        onClick={() => router.push('/')}
                        className="mb-4"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Assignment
                    </Button>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>
                            {showCelebration ? '🎉 Success!' : 'Upload Proof of Gift'}
                        </CardTitle>
                        <CardDescription>
                            {showCelebration
                                ? 'Thank you for being an amazing Secret Santa!'
                                : `Upload a photo of your gift or receipt`
                            }
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {showCelebration ? (
                            <div className="space-y-6 py-8">
                                <div className="text-center space-y-4">
                                    <div className="text-9xl animate-bounce">
                                        🎅
                                    </div>
                                    <h2 className="text-3xl font-bold text-primary">
                                        You are an Official Santa!
                                    </h2>
                                    <p className="text-lg text-muted-foreground">
                                        Thank you for spreading the joy! 🎄✨
                                    </p>
                                </div>
                                {userData.proofImage && (
                                    <div className="relative w-full h-64 rounded-lg overflow-hidden border border-primary shadow-lg">
                                        <img
                                            src={userData.proofImage}
                                            alt="Proof of Gift"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}
                                <Button
                                    className="w-full"
                                    onClick={() => router.push('/')}
                                    size="lg"
                                >
                                    Back to Home
                                </Button>
                            </div>
                        ) : userData.proofImage ? (
                            <div className="space-y-4">
                                <div className="relative w-full h-64 rounded-lg overflow-hidden border border-border">
                                    <img
                                        src={userData.proofImage}
                                        alt="Proof of Gift"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="flex items-center gap-2 text-green-500 justify-center">
                                    <CheckCircle className="w-5 h-5" />
                                    <p className="text-sm font-medium">Already Uploaded!</p>
                                </div>
                                <p className="text-sm text-muted-foreground text-center">
                                    You are an Official Santa! 🎅
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-8 bg-secondary/20">
                                    <Upload className="w-12 h-12 text-muted-foreground mb-4" />
                                    <Label htmlFor="proof" className="text-sm text-muted-foreground mb-2 cursor-pointer">
                                        Click to upload an image
                                    </Label>
                                    <Input
                                        id="proof"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleUpload}
                                        disabled={uploading}
                                        className="cursor-pointer"
                                    />
                                </div>
                                {uploading && (
                                    <p className="text-sm text-muted-foreground text-center animate-pulse">
                                        Uploading...
                                    </p>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
