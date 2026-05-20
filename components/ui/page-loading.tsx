"use client";

import Lottie from "lottie-react";

import animationData from "@/public/lottie/loading.json";

export default function PageLoading() {

    return (

        <div
            className="
                flex min-h-[60vh]
                items-center justify-center
            "
        >

            <div className="w-[140px]">

                <Lottie
                    animationData={animationData}
                    loop={true}
                />

            </div>

        </div>
    );
}