import { Head, Link, usePage } from '@inertiajs/react';
import { dashboard, login } from '@/routes';

export default function Welcome() {
    const { auth } = usePage<{ auth: { user?: unknown } }>().props;

    return (
        <>
            <Head title="Sistem POS" />
            <div className="flex min-h-screen flex-col items-center justify-center bg-[#FDFDFC] p-6 text-[#1b1b18] dark:bg-[#0a0a0a] dark:text-[#EDEDEC]">
                <main className="flex w-full max-w-md flex-col items-center gap-4 rounded-lg bg-white p-10 text-center shadow-[inset_0px_0px_0px_1px_rgba(26,26,0,0.16)] dark:bg-[#161615]">
                    <h1 className="text-2xl font-semibold">Sistem POS</h1>

                    {auth?.user ? (
                        <Link
                            href={dashboard()}
                            className="inline-block rounded-sm border border-black bg-[#1b1b18] px-5 py-1.5 text-sm text-white hover:bg-black dark:border-[#eeeeec] dark:bg-[#eeeeec] dark:text-[#1C1C1A]"
                        >
                            Dashboard
                        </Link>
                    ) : (
                        <Link
                            href={login()}
                            className="inline-block rounded-sm border border-black bg-[#1b1b18] px-5 py-1.5 text-sm text-white hover:bg-black dark:border-[#eeeeec] dark:bg-[#eeeeec] dark:text-[#1C1C1A]"
                        >
                            Log in
                        </Link>
                    )}
                </main>
            </div>
        </>
    );
}
