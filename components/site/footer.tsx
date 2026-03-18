import Container from "./container";

export default function Footer() {
  return (
    <footer className="mt-20 border-t" style={{
      background: "var(--footer-bg)",
      borderColor: "var(--border)",
    }}>
      <Container>
        <div className="flex flex-col gap-3 py-8 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Z's Blog</p>
          <p>Built by Chi</p>
        </div>
      </Container>
    </footer>
  );
}