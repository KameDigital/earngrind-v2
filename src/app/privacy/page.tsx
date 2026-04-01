import Link from "next/link";
export const metadata = { title: "Privacy Policy" };

export default function Privacy() {
    return (
        <div className="max-w-3xl mx-auto p-8 w-full prose">
            <Link href="/" className="text-blue-600 hover:underline no-underline mb-8 inline-block">← Back Home</Link>
            <h1 className="text-4xl font-bold mb-6">Privacy Policy</h1>
            <p>Last updated: {new Date().toLocaleDateString()}</p>
            <p>
                We value your privacy. This policy outlines how we collect, use, and protect your personal data when you use the Earngrind platform.
            </p>
            <h2>Data Collection</h2>
            <p>We collect basic account information (such as email addresses) when you register for the Earngrind App. We do not sell your personal data.</p>
            <h2>Cookies</h2>
            <p>We use essential cookies to maintain your session securely when logging into the App.</p>
        </div>
    );
}
