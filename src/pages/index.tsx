import Image from 'next/image'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })
const callAPI = () => {
  fetch('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ input: 'Who are you?' })
  })
    .then((res) => res.json())
    .then((data) => {
      console.log(data);
    });
};

export default function Home() {
  return (
    <main
      className={`flex min-h-screen flex-col items-center justify-between p-24 ${inter.className}`}
    >
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
      <button onClick={callAPI}>Click me</button>
      </div>
    </main>
  )
}
