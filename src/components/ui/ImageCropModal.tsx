"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { motion } from "framer-motion";
import { CloseCircle } from "iconsax-react";

interface ImageCropModalProps {
    image: string;
    onComplete: (croppedImage: string) => void;
    onClose: () => void;
}

export function ImageCropModal({ image, onComplete, onClose }: ImageCropModalProps) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

    const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const createCroppedImage = async () => {
        try {
            const croppedImage = await getCroppedImg(image, croppedAreaPixels);
            onComplete(croppedImage);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={onClose}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            />

            {/* Modal */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none"
            >
                <div className="glass-card rounded-3xl p-8 w-full max-w-2xl relative pointer-events-auto">
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-xl transition-colors z-10"
                    >
                        <CloseCircle size="28" className="text-[#999999]" />
                    </button>

                    <h2 className="text-3xl font-bold text-gradient-hero mb-6">Crop Profile Picture</h2>

                    {/* Crop Area */}
                    <div className="relative w-full h-96 bg-black/50 rounded-2xl overflow-hidden mb-6">
                        <Cropper
                            image={image}
                            crop={crop}
                            zoom={zoom}
                            aspect={1}
                            cropShape="round"
                            showGrid={false}
                            onCropChange={setCrop}
                            onCropComplete={onCropComplete}
                            onZoomChange={setZoom}
                        />
                    </div>

                    {/* Zoom Slider */}
                    <div className="mb-6">
                        <label className="block text-white font-medium mb-3">Zoom</label>
                        <input
                            type="range"
                            min={1}
                            max={3}
                            step={0.1}
                            value={zoom}
                            onChange={(e) => setZoom(Number(e.target.value))}
                            className="w-full"
                        />
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-4">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={createCroppedImage}
                            className="flex-1 py-3 bg-gradient-to-br from-[#4FACFE] to-[#00F260] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
                        >
                            Apply
                        </button>
                    </div>
                </div>
            </motion.div>
        </>
    );
}

// Helper function to create cropped image
async function getCroppedImg(imageSrc: string, pixelCrop: any): Promise<string> {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
        throw new Error("No 2d context");
    }

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    );

    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            if (!blob) {
                return;
            }
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = () => {
                resolve(reader.result as string);
            };
        }, "image/jpeg");
    });
}

function createImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener("load", () => resolve(image));
        image.addEventListener("error", (error) => reject(error));
        image.src = url;
    });
}
