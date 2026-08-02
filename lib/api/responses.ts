import { NextResponse } from "next/server";

export function apiBadRequest(message = "请求参数无效。") {
  return NextResponse.json({ ok: false, message }, { status: 400 });
}

export function apiRateLimited(message = "请求过于频繁，请稍后再试。") {
  return NextResponse.json({ ok: false, message }, { status: 429 });
}

export function apiServerError(message = "服务器暂时无法处理请求，请稍后再试。") {
  return NextResponse.json({ ok: false, message }, { status: 500 });
}
