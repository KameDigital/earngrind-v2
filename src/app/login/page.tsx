import { login, signup } from './actions';

export default function LoginPage({
    searchParams,
}: {
    searchParams: { error: string };
}) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
            <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
                <h1 className="text-2xl font-bold text-center mb-6">Welcome Back</h1>

                <form className="flex flex-col gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
                            Email
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">
                            Password
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {searchParams?.error && (
                        <p className="text-red-500 text-sm bg-red-50 p-3 rounded">{searchParams.error}</p>
                    )}

                    <div className="flex flex-col gap-2 mt-4">
                        <button
                            formAction={login}
                            className="w-full bg-blue-600 text-white font-semibold py-2 rounded-md hover:bg-blue-700 transition"
                        >
                            Sign In
                        </button>
                        <button
                            formAction={signup}
                            className="w-full bg-gray-100 text-gray-800 font-semibold py-2 rounded-md hover:bg-gray-200 transition"
                        >
                            Sign Up
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
