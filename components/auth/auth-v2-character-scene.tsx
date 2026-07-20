"use client";

import { useEffect, useRef, useState } from "react";

export type AuthV2CharacterFocus = "identity" | "password" | null;

export function AuthV2CharacterScene({
  focusedField,
  passwordLength,
  passwordVisible,
}: {
  focusedField: AuthV2CharacterFocus;
  passwordLength: number;
  passwordVisible: boolean;
}) {
  const stageFrameRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const [sceneScale, setSceneScale] = useState(1);
  const [isPurpleBlinking, setIsPurpleBlinking] = useState(false);
  const [isBlackBlinking, setIsBlackBlinking] = useState(false);
  const [isLookingAtEachOther, setIsLookingAtEachOther] = useState(false);
  const [isPurplePeeking, setIsPurplePeeking] = useState(false);
  const isPasswordPrivate = passwordLength > 0 && !passwordVisible;
  const isPasswordPeek = passwordLength > 0 && passwordVisible;
  const isTyping = focusedField === "identity";

  useEffect(() => {
    const frame = stageFrameRef.current;
    if (!frame) {
      return;
    }

    let frameId = 0;
    const updateScale = () => {
      frameId = 0;
      setSceneScale(Math.min(1, frame.clientWidth / 550));
    };
    const observer = new ResizeObserver(updateScale);
    observer.observe(frame);
    frameId = window.requestAnimationFrame(updateScale);

    return () => {
      observer.disconnect();
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, []);

  useEffect(() => {
    const timers: Array<ReturnType<typeof setTimeout>> = [];

    function scheduleBlink(setBlinking: (value: boolean) => void) {
      const timer = setTimeout(() => {
        setBlinking(true);
        const resetTimer = setTimeout(() => {
          setBlinking(false);
          scheduleBlink(setBlinking);
        }, 150);
        timers.push(resetTimer);
      }, Math.random() * 4000 + 3000);

      timers.push(timer);
    }

    scheduleBlink(setIsPurpleBlinking);
    scheduleBlink(setIsBlackBlinking);

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  useEffect(() => {
    if (focusedField !== "identity") {
      return;
    }

    const startTimer = setTimeout(() => {
      setIsLookingAtEachOther(true);
    }, 0);
    const resetTimer = setTimeout(() => setIsLookingAtEachOther(false), 800);

    return () => {
      clearTimeout(startTimer);
      clearTimeout(resetTimer);
    };
  }, [focusedField]);

  useEffect(() => {
    let peekTimer: ReturnType<typeof setTimeout> | null = null;
    let resetTimer: ReturnType<typeof setTimeout> | null = null;

    function schedulePeek() {
      if (passwordLength > 0 && passwordVisible) {
        peekTimer = setTimeout(() => {
          setIsPurplePeeking(true);
          resetTimer = setTimeout(() => {
            setIsPurplePeeking(false);
            schedulePeek();
          }, 800);
        }, Math.random() * 3000 + 2000);
      } else {
        resetTimer = setTimeout(() => setIsPurplePeeking(false), 0);
      }
    }

    schedulePeek();

    return () => {
      if (peekTimer) {
        clearTimeout(peekTimer);
      }
      if (resetTimer) {
        clearTimeout(resetTimer);
      }
    };
  }, [passwordLength, passwordVisible]);

  function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
  }

  function calculatePosition(element: HTMLElement | null) {
    if (!element) {
      return { faceX: 0, faceY: 0, bodySkew: 0 };
    }

    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 3;
    const deltaX = mouseRef.current.x - centerX;
    const deltaY = mouseRef.current.y - centerY;

    return {
      faceX: clamp(deltaX / 20, -15, 15),
      faceY: clamp(deltaY / 30, -10, 10),
      bodySkew: clamp(-deltaX / 120, -6, 6),
    };
  }

  function calculatePupilTransform(
    element: HTMLElement | null,
    maxDistance: number,
    forceLookX?: number,
    forceLookY?: number
  ) {
    if (!element) {
      return "translate(0px, 0px)";
    }

    if (forceLookX !== undefined && forceLookY !== undefined) {
      return `translate(${forceLookX}px, ${forceLookY}px)`;
    }

    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = mouseRef.current.x - centerX;
    const deltaY = mouseRef.current.y - centerY;
    const distance = Math.min(Math.hypot(deltaX, deltaY), maxDistance);
    const angle = Math.atan2(deltaY, deltaX);

    return `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px)`;
  }

  function setPx(element: HTMLElement | null, prop: "left" | "top" | "width" | "height", value: number) {
    if (element) {
      element.style[prop] = `${value}px`;
    }
  }

  function setTransform(element: HTMLElement | null, value: string) {
    if (element) {
      element.style.transform = value;
    }
  }

  function updateEyeBall(
    eyeElement: HTMLElement | null,
    pupilElement: HTMLElement | null,
    options: {
      size: number;
      maxDistance: number;
      isBlinking: boolean;
      forceLookX?: number;
      forceLookY?: number;
    }
  ) {
    if (!eyeElement || !pupilElement) {
      return;
    }

    eyeElement.style.width = `${options.size}px`;
    eyeElement.style.height = options.isBlinking ? "2px" : `${options.size}px`;
    pupilElement.style.display = options.isBlinking ? "none" : "block";

    if (!options.isBlinking) {
      pupilElement.style.transform = calculatePupilTransform(
        eyeElement,
        options.maxDistance,
        options.forceLookX,
        options.forceLookY
      );
    }
  }

  function renderCharacters() {
    const stage = stageRef.current;
    if (!stage) {
      return;
    }

    const byId = <T extends HTMLElement>(id: string) => stage.querySelector<T>(`#${id}`);
    const purpleCharacter = byId<HTMLDivElement>("purple-character");
    const blackCharacter = byId<HTMLDivElement>("black-character");
    const orangeCharacter = byId<HTMLDivElement>("orange-character");
    const yellowCharacter = byId<HTMLDivElement>("yellow-character");
    const purpleEyes = byId<HTMLDivElement>("purple-eyes");
    const blackEyes = byId<HTMLDivElement>("black-eyes");
    const orangeEyes = byId<HTMLDivElement>("orange-eyes");
    const yellowEyes = byId<HTMLDivElement>("yellow-eyes");
    const yellowMouth = byId<HTMLDivElement>("yellow-mouth");
    const purplePos = calculatePosition(purpleCharacter);
    const blackPos = calculatePosition(blackCharacter);
    const orangePos = calculatePosition(orangeCharacter);
    const yellowPos = calculatePosition(yellowCharacter);

    setPx(purpleCharacter, "height", isTyping || isPasswordPrivate ? 440 : 400);
    setTransform(
      purpleCharacter,
      isPasswordPeek
        ? "skewX(0deg)"
        : isTyping || isPasswordPrivate
          ? `skewX(${purplePos.bodySkew - 12}deg) translateX(40px)`
          : `skewX(${purplePos.bodySkew}deg)`
    );
    setTransform(
      blackCharacter,
      isPasswordPeek
        ? "skewX(0deg)"
        : isLookingAtEachOther
          ? `skewX(${blackPos.bodySkew * 1.5 + 10}deg) translateX(20px)`
          : isTyping || isPasswordPrivate
            ? `skewX(${blackPos.bodySkew * 1.5}deg)`
            : `skewX(${blackPos.bodySkew}deg)`
    );
    setTransform(orangeCharacter, isPasswordPeek ? "skewX(0deg)" : `skewX(${orangePos.bodySkew}deg)`);
    setTransform(yellowCharacter, isPasswordPeek ? "skewX(0deg)" : `skewX(${yellowPos.bodySkew}deg)`);

    setPx(purpleEyes, "left", isPasswordPeek ? 20 : isLookingAtEachOther ? 55 : 45 + purplePos.faceX);
    setPx(purpleEyes, "top", isPasswordPeek ? 35 : isLookingAtEachOther ? 65 : 40 + purplePos.faceY);
    setPx(blackEyes, "left", isPasswordPeek ? 10 : isLookingAtEachOther ? 32 : 26 + blackPos.faceX);
    setPx(blackEyes, "top", isPasswordPeek ? 28 : isLookingAtEachOther ? 12 : 32 + blackPos.faceY);
    setPx(orangeEyes, "left", isPasswordPeek ? 50 : 82 + orangePos.faceX);
    setPx(orangeEyes, "top", isPasswordPeek ? 85 : 90 + orangePos.faceY);
    setPx(yellowEyes, "left", isPasswordPeek ? 20 : 52 + yellowPos.faceX);
    setPx(yellowEyes, "top", isPasswordPeek ? 35 : 40 + yellowPos.faceY);
    setPx(yellowMouth, "left", isPasswordPeek ? 10 : 40 + yellowPos.faceX);
    setPx(yellowMouth, "top", isPasswordPeek ? 88 : 88 + yellowPos.faceY);

    const purpleForceX = isPasswordPeek ? (isPurplePeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined;
    const purpleForceY = isPasswordPeek ? (isPurplePeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined;
    const blackForceX = isPasswordPeek ? -4 : isLookingAtEachOther ? 0 : undefined;
    const blackForceY = isPasswordPeek ? -4 : isLookingAtEachOther ? -4 : undefined;
    const frontForceX = isPasswordPeek ? -5 : undefined;
    const frontForceY = isPasswordPeek ? -4 : undefined;

    updateEyeBall(byId("purple-eye-1"), byId("purple-pupil-1"), {
      size: 18,
      maxDistance: 5,
      isBlinking: isPurpleBlinking,
      forceLookX: purpleForceX,
      forceLookY: purpleForceY,
    });
    updateEyeBall(byId("purple-eye-2"), byId("purple-pupil-2"), {
      size: 18,
      maxDistance: 5,
      isBlinking: isPurpleBlinking,
      forceLookX: purpleForceX,
      forceLookY: purpleForceY,
    });
    updateEyeBall(byId("black-eye-1"), byId("black-pupil-1"), {
      size: 16,
      maxDistance: 4,
      isBlinking: isBlackBlinking,
      forceLookX: blackForceX,
      forceLookY: blackForceY,
    });
    updateEyeBall(byId("black-eye-2"), byId("black-pupil-2"), {
      size: 16,
      maxDistance: 4,
      isBlinking: isBlackBlinking,
      forceLookX: blackForceX,
      forceLookY: blackForceY,
    });
    setTransform(byId("orange-pupil-1"), calculatePupilTransform(byId("orange-pupil-1"), 5, frontForceX, frontForceY));
    setTransform(byId("orange-pupil-2"), calculatePupilTransform(byId("orange-pupil-2"), 5, frontForceX, frontForceY));
    setTransform(byId("yellow-pupil-1"), calculatePupilTransform(byId("yellow-pupil-1"), 5, frontForceX, frontForceY));
    setTransform(byId("yellow-pupil-2"), calculatePupilTransform(byId("yellow-pupil-2"), 5, frontForceX, frontForceY));
  }

  useEffect(() => {
    renderCharacters();
  });

  useEffect(() => {
    let frameId = 0;

    function handleMouseMove(event: MouseEvent) {
      mouseRef.current = { x: event.clientX, y: event.clientY };

      if (!frameId) {
        frameId = window.requestAnimationFrame(() => {
          frameId = 0;
          renderCharacters();
        });
      }
    }

    mouseRef.current = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("resize", renderCharacters);
    renderCharacters();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", renderCharacters);
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
    };
  });

  return (
    <div className="relative min-w-0 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-soft)] p-5 shadow-[var(--shadow-md)] sm:p-6 lg:h-full lg:min-h-145 lg:p-8">
      <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(var(--text)_1px,transparent_1px),linear-gradient(90deg,var(--text)_1px,transparent_1px)] [background-size:28px_28px]" />

      <div className="relative z-10 flex h-full flex-col justify-between gap-8">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-xs font-semibold text-[var(--text-soft)] shadow-[var(--shadow-sm)]">
            <span className="size-2 rounded-full bg-[var(--success)]" />
            Secure student portal
          </div>

          <h2 className="max-w-110 text-xl font-bold leading-tight text-[var(--text)] sm:text-3xl">
            让每一次登录，都进入清晰的学习工作台
          </h2>

          <p className="mt-3 max-w-105 text-sm leading-6 text-[var(--text-soft)]">
            账号、课程、练习记录与 AI 批改集中管理，适合正式学习场景的稳重入口。
          </p>
        </div>

        <div ref={stageFrameRef} className="relative mx-auto w-full max-w-[550px]" style={{ height: 400 * sceneScale }} aria-hidden="true">
          <div
            ref={stageRef}
            className="absolute left-1/2 top-0"
            style={{
              width: 550,
              height: 400,
              transform: `translateX(-50%) scale(${sceneScale})`,
              transformOrigin: "top center",
            }}
          >
            <div
              id="purple-character"
              className="absolute bottom-0 origin-bottom transition-all duration-700 ease-in-out"
              style={{
                left: 70,
                width: 180,
                height: 400,
                backgroundColor: "#6C3FF5",
                borderRadius: "10px 10px 0 0",
                zIndex: 1,
              }}
            >
              <div id="purple-eyes" className="absolute flex transition-all duration-700 ease-in-out" style={{ gap: 32, left: 45, top: 40 }}>
                <div id="purple-eye-1" className="flex items-center justify-center overflow-hidden rounded-full bg-white transition-all duration-150" style={{ width: 18, height: 18 }}><div id="purple-pupil-1" className="rounded-full bg-[#2D2D2D] transition-transform duration-100" style={{ width: 7, height: 7 }} /></div>
                <div id="purple-eye-2" className="flex items-center justify-center overflow-hidden rounded-full bg-white transition-all duration-150" style={{ width: 18, height: 18 }}><div id="purple-pupil-2" className="rounded-full bg-[#2D2D2D] transition-transform duration-100" style={{ width: 7, height: 7 }} /></div>
              </div>
            </div>

            <div
              id="black-character"
              className="absolute bottom-0 origin-bottom transition-all duration-700 ease-in-out"
              style={{
                left: 240,
                width: 120,
                height: 310,
                backgroundColor: "#2D2D2D",
                borderRadius: "8px 8px 0 0",
                zIndex: 2,
              }}
            >
              <div id="black-eyes" className="absolute flex transition-all duration-700 ease-in-out" style={{ gap: 24, left: 26, top: 32 }}>
                <div id="black-eye-1" className="flex items-center justify-center overflow-hidden rounded-full bg-white transition-all duration-150" style={{ width: 16, height: 16 }}><div id="black-pupil-1" className="rounded-full bg-[#2D2D2D] transition-transform duration-100" style={{ width: 6, height: 6 }} /></div>
                <div id="black-eye-2" className="flex items-center justify-center overflow-hidden rounded-full bg-white transition-all duration-150" style={{ width: 16, height: 16 }}><div id="black-pupil-2" className="rounded-full bg-[#2D2D2D] transition-transform duration-100" style={{ width: 6, height: 6 }} /></div>
              </div>
            </div>

            <div
              id="orange-character"
              className="absolute bottom-0 origin-bottom transition-all duration-700 ease-in-out"
              style={{
                left: 0,
                width: 240,
                height: 200,
                backgroundColor: "#FF9B6B",
                borderRadius: "120px 120px 0 0",
                zIndex: 3,
              }}
            >
              <div id="orange-eyes" className="absolute flex transition-all duration-200 ease-out" style={{ gap: 32, left: 82, top: 90 }}>
                <div id="orange-pupil-1" className="rounded-full bg-[#2D2D2D] transition-transform duration-100" style={{ width: 12, height: 12 }} />
                <div id="orange-pupil-2" className="rounded-full bg-[#2D2D2D] transition-transform duration-100" style={{ width: 12, height: 12 }} />
              </div>
            </div>

            <div
              id="yellow-character"
              className="absolute bottom-0 origin-bottom transition-all duration-700 ease-in-out"
              style={{
                left: 310,
                width: 140,
                height: 230,
                backgroundColor: "#E8D754",
                borderRadius: "70px 70px 0 0",
                zIndex: 4,
              }}
            >
              <div id="yellow-eyes" className="absolute flex transition-all duration-200 ease-out" style={{ gap: 24, left: 52, top: 40 }}>
                <div id="yellow-pupil-1" className="rounded-full bg-[#2D2D2D] transition-transform duration-100" style={{ width: 12, height: 12 }} />
                <div id="yellow-pupil-2" className="rounded-full bg-[#2D2D2D] transition-transform duration-100" style={{ width: 12, height: 12 }} />
              </div>
              <div id="yellow-mouth" className="absolute h-1 rounded-full bg-[#2D2D2D] transition-all duration-200 ease-out" style={{ width: 80, left: 40, top: 88 }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
