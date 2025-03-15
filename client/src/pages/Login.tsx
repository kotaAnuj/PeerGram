import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const usernameSchema = z.object({
  username: z.string()
    .min(3, { message: 'Username must be at least 3 characters' })
    .max(20, { message: 'Username must be at most 20 characters' })
    .regex(/^[a-zA-Z0-9._]+$/, { message: 'Username can only contain letters, numbers, dots and underscores' })
});

export default function Login() {
  const { login, register, firebaseUser, isAuthenticated } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  
  const form = useForm<z.infer<typeof usernameSchema>>({
    resolver: zodResolver(usernameSchema),
    defaultValues: {
      username: '',
    },
  });

  // If we have a firebase user but no profile, show registration form
  useEffect(() => {
    if (firebaseUser && !isAuthenticated) {
      setIsRegistering(true);
    }
  }, [firebaseUser, isAuthenticated]);

  const handleRegister = async (values: z.infer<typeof usernameSchema>) => {
    await register(values.username);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-lightgray p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">P2P Social</CardTitle>
          <CardDescription>
            A true peer-to-peer social network with distributed storage
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {isRegistering && firebaseUser ? (
            <div>
              <div className="mb-6 text-center">
                <img
                  src={firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${firebaseUser.displayName || 'User'}&background=random`}
                  alt="Profile"
                  className="w-20 h-20 rounded-full mx-auto mb-3"
                />
                <h3 className="font-semibold">Welcome, {firebaseUser.displayName}</h3>
                <p className="text-sm text-gray-500">Choose a username to continue</p>
              </div>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleRegister)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="username" 
                            {...field} 
                            autoComplete="off"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={form.formState.isSubmitting}
                  >
                    {form.formState.isSubmitting ? 'Creating Account...' : 'Complete Registration'}
                  </Button>
                </form>
              </Form>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    P2P Social Network
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full flex items-center justify-center" 
                  onClick={login}
                >
                  <svg 
                    viewBox="0 0 24 24" 
                    className="h-5 w-5 mr-2" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Continue with Google
                </Button>
              </div>
              
              <div className="text-center text-sm text-gray-500">
                By continuing, you agree to our terms and privacy policy.
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center text-xs text-gray-500 border-t border-border w-full pt-4">
            <p>P2P Social is a decentralized social platform</p>
            <p>Your data stays with you, not on corporate servers</p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
