/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameCanvas } from './components/GameCanvas.tsx';

export default function App() {
  return (
    <main className="w-full h-[100dvh] flex flex-col items-center justify-center bg-slate-950 overflow-hidden select-none">
      <GameCanvas />
    </main>
  );
}
