import React from "react";
import Button from "@/components/ui/Button";
import RatingPill from "@/components/ui/RatingPill";

export default function ComparisonTable() {
    const platforms = [
        {
            name: "Swagbucks",
            rating: 4.2,
            payout: "$3.00",
            speed: "Average",
            bestFor: "Variety of tasks",
            slug: "swagbucks-review"
        },
        {
            name: "Prolific",
            rating: 4.9,
            payout: "$6.00",
            speed: "Fast",
            bestFor: "High hourly rate",
            slug: "prolific-review"
        },
        {
            name: "UserTesting",
            rating: 4.5,
            payout: "$10.00",
            speed: "Fast",
            bestFor: "$10+ tests",
            slug: "usertesting-review"
        }
    ];

    return (
        <div className="w-full overflow-x-auto pb-4">
            <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                    <tr className="border-b-2 border-gray-100">
                        <th className="py-4 px-6 font-bold text-gray-900 w-1/4">Platform</th>
                        <th className="py-4 px-6 font-bold text-gray-900">Rating</th>
                        <th className="py-4 px-6 font-bold text-gray-900">Min Payout</th>
                        <th className="py-4 px-6 font-bold text-gray-900">Best For</th>
                        <th className="py-4 px-6 font-bold text-gray-900 text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {platforms.map((p) => (
                        <tr key={p.slug} className="hover:bg-gray-50/50 transition-colors">
                            <td className="py-5 px-6 font-bold text-gray-900 text-lg">{p.name}</td>
                            <td className="py-5 px-6"><RatingPill rating={p.rating} /></td>
                            <td className="py-5 px-6 text-gray-600 font-medium">{p.payout}</td>
                            <td className="py-5 px-6 text-gray-600">{p.bestFor}</td>
                            <td className="py-5 px-6 text-right">
                                <Button variant="secondary" href={`/review/${p.slug}`} className="px-4 py-2 text-sm">
                                    Read Review
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
