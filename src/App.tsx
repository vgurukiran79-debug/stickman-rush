/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameCanvas } from './components/GameCanvas.tsx';

export default function App() {
  return (
    <main className="w-screen h-screen flex flex-col items-center justify-center bg-slate-950 overflow-hidden">
      <GameCanvas />
    </main>
  );
}
