import { cn } from '@/lib/utils';
import { type HTMLAttributes } from 'react';

export default function AppLogoIcon({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn("w-32", className)} {...props}>
            {/* Logo untuk light mode */}
            <img 
                src="/asset/img/Horizontal Dark.png" 
                className="w-32 block dark:hidden" 
                alt="Logo" 
            />
            {/* Logo untuk dark mode */}
            <img 
                src="/asset/img/Horizontal.png" 
                className="w-32 hidden dark:block" 
                alt="Logo" 
            />
        </div>
    );
}
