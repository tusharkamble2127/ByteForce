import { Scanner } from "@yudiel/react-qr-scanner";

export default function QrScanner({ onCode, onError }: { onCode: (code: string) => void; onError?: (error: Error) => void }) {
  return (
    <Scanner
      onScan={(r) => r[0]?.rawValue && onCode(r[0].rawValue)}
      scanDelay={1500}
      onError={(error) => onError?.(error)}
      styles={{ 
        container: { borderRadius: 12, overflow: "hidden" },
        video: { objectFit: "cover" }
      }}
    />
  );
}
