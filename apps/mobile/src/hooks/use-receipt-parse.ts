import type { inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from 'broccoli-api/router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { trpc } from '@/lib/trpc';

// What receipt.get returns — status, metadata, and the extracted items.
// (Type-only imports, erased at build — same trick as the tRPC client.)
export type ParsedReceipt = inferRouterOutputs<AppRouter>['receipt']['get'];

export type ParseState =
  | { status: 'idle' }
  | { status: 'processing' }
  | { status: 'ready'; receipt: ParsedReceipt }
  | { status: 'error'; message: string };

const POLL_INTERVAL_MS = 2000;
// PRD §1 promises photo → reviewed list in under 60s; if parsing runs well
// past that something is wrong, so stop polling and let the user retry.
const POLL_TIMEOUT_MS = 90_000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Owns the parse leg of the core loop: hand an uploaded receipt to
// receipt.create, then poll receipt.get until the background parse lands on
// READY (or ERROR). `run` bumps on every start/reset/unmount so a stale poll
// loop can never write state over a newer one.
export function useReceiptParse() {
  const [state, setState] = useState<ParseState>({ status: 'idle' });
  const run = useRef(0);

  useEffect(() => {
    return () => {
      // Invalidate any in-flight poll loop on unmount. Bumping the *latest*
      // counter is the point here, so the stale-ref lint rule doesn't apply.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      run.current++;
    };
  }, []);

  const start = useCallback(async (upload: { url: string; key: string }) => {
    const thisRun = ++run.current;
    const live = () => run.current === thisRun;
    setState({ status: 'processing' });

    try {
      const { receiptId } = await trpc.receipt.create.mutate({
        imageUrl: upload.url,
        imageKey: upload.key,
      });

      const deadline = Date.now() + POLL_TIMEOUT_MS;
      while (live() && Date.now() < deadline) {
        await sleep(POLL_INTERVAL_MS);
        if (!live()) return;
        const receipt = await trpc.receipt.get.query({ id: receiptId });
        if (!live()) return;

        if (receipt.status === 'READY') {
          setState({ status: 'ready', receipt });
          return;
        }
        if (receipt.status === 'ERROR') {
          setState({
            status: 'error',
            message: "We couldn't read that receipt. Try a clearer photo.",
          });
          return;
        }
      }
      if (live()) {
        setState({
          status: 'error',
          message: 'Reading your receipt is taking too long. Please try again.',
        });
      }
    } catch {
      if (live()) {
        setState({
          status: 'error',
          message: "Couldn't save your receipt. Check your connection and try again.",
        });
      }
    }
  }, []);

  const reset = useCallback(() => {
    run.current++;
    setState({ status: 'idle' });
  }, []);

  return { state, start, reset };
}
