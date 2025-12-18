'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useEnsName } from 'wagmi';
import { useState, useEffect } from 'react';
import { Loader2, Gift, User, Users, Upload, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type UserData = {
  id: string;
  name: string;
  isClaimed?: boolean;
  proofImage?: string;
};

export default function Home() {
  const { address, isConnected } = useAccount();

  // Dual-chain name resolution
  const { data: ensNameMainnet } = useEnsName({ address, chainId: 1 });
  const { data: ensNameBase } = useEnsName({ address, chainId: 8453 });

  const displayName = ensNameMainnet || ensNameBase || "No ENS name found";
  const hasName = !!(ensNameMainnet || ensNameBase);

  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [assignedPerson, setAssignedPerson] = useState<UserData | null>(null);
  const [participants, setParticipants] = useState<UserData[]>([]);
  const [uploading, setUploading] = useState(false);

  const fetchParticipants = () => {
    fetch('/api/participants')
      .then(res => res.json())
      .then(data => {
        if (data.users) setParticipants(data.users);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchParticipants();
  }, []);

  async function handleLogin() {
    if (!address || !userId) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, wallet: address }),
      });
      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        setUserData(data.user);
        setAssignedPerson(data.assignedPerson);
        // Save to sessionStorage for proof page
        sessionStorage.setItem('userData', JSON.stringify(data.user));
        sessionStorage.setItem('assignedPerson', JSON.stringify(data.assignedPerson));
        fetchParticipants(); // Refresh list to show "Participated"
      }
    } catch (e) {
      setError('Failed to login. Please try again.');
    } finally {
      setLoading(false);
    }
  }

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
        setUserData(prev => prev ? { ...prev, proofImage: data.path } : null);
        fetchParticipants(); // Refresh list to show "Official Santa"
      }
    } catch (error) {
      console.error('Upload failed', error);
    } finally {
      setUploading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-background relative overflow-hidden text-foreground">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-background to-background pointer-events-none" />

      {/* Minimal Snow Effect */}
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

      {/* Top Right Wallet Connect - Only show when connected to allow disconnect */}
      {isConnected && (
        <div className="absolute top-4 right-4 z-50 flex flex-col items-end gap-1">
          <ConnectButton showBalance={false} />
          {hasName && (
            <span className="text-xs text-primary font-medium bg-primary/10 px-2 py-1 rounded-full border border-primary/20">
              Hello, {displayName}
            </span>
          )}
        </div>
      )}

      <div className="z-10 w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tighter text-foreground flex items-center justify-center gap-2">
            <Gift className="w-8 h-8 text-primary" />
            Secret Santa
          </h1>
          <p className="text-muted-foreground">Enter your ID to reveal your assignment.</p>
        </div>

        {!isConnected ? (
          <Card>
            <CardHeader>
              <CardTitle>Connect Wallet</CardTitle>
              <CardDescription>
                Connect your wallet with Basename or ENS
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center pb-6">
              <ConnectButton showBalance={false} />
            </CardContent>
          </Card>
        ) : !userData ? (
          <Card>
            <CardHeader>
              <CardTitle>Identity Verification</CardTitle>
              <CardDescription>Enter your unique participant ID.</CardDescription>
              <div className="flex items-center justify-center gap-2 mt-2 p-2 bg-secondary/50 rounded-lg">
                <span className="text-xs font-medium text-muted-foreground">Wallet Name:</span>
                <span className={`text-sm font-bold ${hasName ? 'text-primary' : 'text-muted-foreground'}`}>
                  {displayName}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="userId">Participant ID</Label>
                <Input
                  id="userId"
                  placeholder="Enter your Hash ID"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button
                className="w-full"
                onClick={handleLogin}
                disabled={!userId || loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Reveal Assignment
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <Card className="border-primary/50 shadow-[0_0_30px_rgba(var(--primary),0.2)]">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Welcome, {userData.name}</CardTitle>
              <CardDescription>Here is your divine assignment.</CardDescription>
              <div className="flex items-center justify-center gap-2 mt-2 p-2 bg-secondary/50 rounded-lg inline-flex mx-auto">
                <span className="text-xs font-medium text-muted-foreground">Wallet Name:</span>
                <span className={`text-sm font-bold ${hasName ? 'text-primary' : 'text-muted-foreground'}`}>
                  {displayName}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center p-6 bg-secondary/20 rounded-xl border border-border">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-2">Your Christ Child Is</p>
                <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                  <User className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-3xl font-bold text-foreground">{assignedPerson?.name}</h2>
              </div>

              {/* Navigate to Proof Upload */}
              <div className="pt-4 border-t border-border">
                <Button
                  className="w-full"
                  onClick={() => {
                    // Ensure data is in sessionStorage
                    sessionStorage.setItem('userData', JSON.stringify(userData));
                    sessionStorage.setItem('assignedPerson', JSON.stringify(assignedPerson));
                    window.location.href = '/proof';
                  }}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {userData.proofImage ? 'View Proof of Gift' : 'Upload Proof of Gift'}
                </Button>
                {userData.proofImage && (
                  <p className="text-xs text-green-500 text-center mt-2 flex items-center justify-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    You are an Official Santa! 🎅
                  </p>
                )}
              </div>
            </CardContent>
            <CardFooter className="justify-center">
              <p className="text-xs text-muted-foreground text-center">
                This assignment is permanent and linked to your wallet.
              </p>
            </CardFooter>
          </Card>
        )}

        {/* View Participants Modal */}
        <div className="flex justify-center">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                <Users className="w-4 h-4 mr-2" />
                View Participants
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Participants List</DialogTitle>
                <DialogDescription>
                  List of all participants in the circle.
                </DialogDescription>
              </DialogHeader>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {participants.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.name}
                      </TableCell>
                      <TableCell className="text-right">
                        {user.proofImage ? (
                          <span className="text-xs text-yellow-500 font-bold flex items-center justify-end gap-1">
                            <Gift className="w-3 h-3" />
                            Official Santa
                          </span>
                        ) : user.isClaimed ? (
                          <span className="text-xs text-green-500 font-medium">Participated</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Yet to</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </main>
  );
}
