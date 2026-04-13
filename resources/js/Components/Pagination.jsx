import { Link } from '@inertiajs/react';
import React from 'react';

export default function Pagination({ links }) {

    function getClassName(active) {
        if (active) {
            return "mr-1 mb-1 px-4 py-3 text-sm leading-4 border rounded focus:border-primary bg-primary text-white";
        } else {
            return "mr-1 mb-1 px-4 py-3 text-sm leading-4 border rounded hover:bg-primary hover:text-white transition-colors duration-200 text-primary";
        }
    }

    return (
        links && links.length > 3 && (
            <div className="mb-4">
                <div className="flex flex-wrap mt-8 justify-center">
                    {links.map((link, key) => (
                        link.url === null ?
                            (<div
                                key={key}
                                className="mr-1 mb-1 px-4 py-3 text-sm leading-4 text-gray-400 border rounded"
                            >
                                <span dangerouslySetInnerHTML={{ __html: `${link.label}` }}></span>
                            </div>) :

                            (<Link
                                key={key}
                                className={getClassName(link.active)}
                                href={link.url}
                            >
                                <span dangerouslySetInnerHTML={{ __html: `${link.label}` }}></span>
                            </Link>)
                    ))}
                </div>
            </div>
        )
    );
}
