import { MockupFrame } from "./mockup-frame";

export function EditorMockup() {
  return (
    <MockupFrame className="p-6">
      <div className="academic-doc scale-90 text-left">
        <p className="mb-1 text-[0.6rem] tracking-wide text-muted-foreground uppercase">
          BAB I
        </p>
        <h1 className="!mt-0 !text-left !text-base">Pendahuluan</h1>
        <h2 className="mt-3 !text-sm">1.1 Latar Belakang</h2>
        <p className="!mb-0 text-sm">
          Penulisan karya ilmiah sering kali melibatkan proses bolak-balik
          antara alat riset dan naskah utama, yang berisiko memutus konteks
          argumen yang sedang dibangun...
        </p>
      </div>
    </MockupFrame>
  );
}
