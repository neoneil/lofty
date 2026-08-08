import { redirect } from "next/navigation";

type Props = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SignUpPage({ searchParams }: Props) {
  const params = await searchParams;
  const next = firstValue(params?.next);
  const error = firstValue(params?.error);
  const query = new URLSearchParams();
  if (next) query.set("next", next);
  if (error) query.set("error", error);

  redirect(`/sign-up-v2${query.size ? `?${query.toString()}` : ""}`);
}
