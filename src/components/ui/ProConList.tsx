import React from "react";

interface ProConListProps {
    pros: string[];
    cons: string[];
}

export default function ProConList({ pros, cons }: ProConListProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            {/* Pros */}
            <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-green-600">The Good</h3>
                <ul className="space-y-3">
                    {pros.map((item, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-gray-700 leading-relaxed">
                            <span className="flex-shrink-0 mt-1 w-5 h-5 flex items-center justify-center rounded-full bg-green-100 text-green-600">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            </span>
                            {item}
                        </li>
                    ))}
                </ul>
            </div>

            {/* Cons */}
            <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-red-600">The Bad</h3>
                <ul className="space-y-3">
                    {cons.map((item, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-gray-700 leading-relaxed">
                            <span className="flex-shrink-0 mt-1 w-5 h-5 flex items-center justify-center rounded-full bg-red-100 text-red-600">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M18 12H6" />
                                </svg>
                            </span>
                            {item}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
