"use client";

interface AvatarProps {
    name: string;
    imageUrl?: string;
    size?: "sm" | "md" | "lg" | "xl";
    className?: string;
}

export function Avatar({ name, imageUrl, size = "md", className = "" }: AvatarProps) {
    const sizeClasses = {
        sm: "w-8 h-8 text-sm",
        md: "w-10 h-10 text-base",
        lg: "w-16 h-16 text-2xl",
        xl: "w-24 h-24 text-4xl",
    };

    const getInitial = () => {
        return name?.charAt(0).toUpperCase() || "U";
    };

    return (
        <div className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-bold ${className}`}>
            {imageUrl ? (
                <img
                    src={imageUrl}
                    alt={name}
                    className="w-full h-full rounded-full object-cover"
                />
            ) : (
                <div className="w-full h-full rounded-full bg-gradient-to-br from-[#4FACFE] to-[#00F260] flex items-center justify-center text-white">
                    {getInitial()}
                </div>
            )}
        </div>
    );
}
