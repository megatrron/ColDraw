// import Script from "next/script"

export default function RoomLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      {/* <Script
        src="https://meet.jit.si/external_api.js"
        strategy="afterInteractive"
      /> */}
    </>
  )
}
