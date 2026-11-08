import React, { StrictMode } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(), subscribe: vi.fn(), prepare: vi.fn(), finalize: vi.fn(),
  upload: vi.fn(), bucket: vi.fn(), table: vi.fn(), listeners: new Set(),
  subscriptions: [], userId: 'owner-a',
}));

vi.mock('../../src/lib/supabase', () => ({
  supabase: {
    auth: { getUser: mocks.getUser, onAuthStateChange: mocks.subscribe },
    storage: { from: mocks.bucket },
    from: mocks.table,
  },
}));
vi.mock('../../src/lib/documentApi', () => ({
  prepareDocumentUpload: mocks.prepare,
  finalizeDocumentUpload: mocks.finalize,
}));

import FileIngestion from '../../src/components/FileIngestion';

const WORKSPACE_A = 'workspace-a';
const WORKSPACE_B = 'workspace-b';
const DOCUMENT_ID = 'document-a';
const FILENAME = 'synthetic.csv';
const RECOVERY = 'Upload outcome could not be confirmed.';
const userResult = (id) => ({ data: { user: id ? { id } : null }, error: null });
const preparedResult = () => ({
  success: true,
  document: { id: DOCUMENT_ID, status: 'PENDING_UPLOAD' },
  upload: { bucketId: 'financial-documents', objectPath: 'mock/canonical/synthetic.csv', signedUploadToken: 'mock-only-capability' },
});
const finalizedResult = () => ({
  success: true, document: { id: DOCUMENT_ID, status: 'UPLOADED' }, transitioned: true,
});
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
const flush = async () => {
  await act(async () => { for (let i = 0; i < 12; i += 1) await Promise.resolve(); });
};
const emit = async (event, id) => {
  mocks.userId = id;
  act(() => { for (const callback of mocks.listeners) callback(event, id ? { user: { id } } : null); });
  await flush();
};
const fixture = (name = FILENAME, type = 'text/csv', size = 27) =>
  new File([new Uint8Array(size)], name, { type });
const uploadButton = () => screen.getByRole('button', { name: /Upload Document|Uploading|Uploaded/ });
const choose = (view, file = fixture()) => {
  fireEvent.change(view.container.querySelector('input[type="file"]'), { target: { files: [file] } });
  return file;
};
const mount = async ({ strict = false, ...initial } = {}) => {
  const props = { isOpen: true, workspaceId: WORKSPACE_A, onClose: vi.fn(), ...initial };
  const element = () => strict ? <StrictMode><FileIngestion {...props} /></StrictMode> : <FileIngestion {...props} />;
  const view = render(element());
  await flush();
  return { ...view, props, update: async (changes) => { Object.assign(props, changes); view.rerender(element()); await flush(); } };
};
const startPending = async (stage) => {
  const pending = deferred();
  mocks[stage].mockReturnValueOnce(pending.promise);
  const view = await mount();
  choose(view);
  fireEvent.click(uploadButton());
  await flush();
  expect(mocks[stage]).toHaveBeenCalledTimes(1);
  return { view, pending };
};

beforeEach(() => {
  vi.useFakeTimers();
  mocks.listeners.clear();
  mocks.subscriptions = [];
  mocks.userId = 'owner-a';
  for (const name of ['getUser', 'subscribe', 'prepare', 'finalize', 'upload', 'bucket', 'table']) mocks[name].mockReset();
  mocks.getUser.mockImplementation(() => Promise.resolve(userResult(mocks.userId)));
  mocks.subscribe.mockImplementation((callback) => {
    mocks.listeners.add(callback);
    const subscription = { unsubscribe: vi.fn(() => mocks.listeners.delete(callback)) };
    mocks.subscriptions.push(subscription);
    return { data: { subscription } };
  });
  mocks.prepare.mockResolvedValue(preparedResult());
  mocks.upload.mockResolvedValue({ data: { path: 'mock/canonical/synthetic.csv' }, error: null });
  mocks.finalize.mockResolvedValue(finalizedResult());
  mocks.bucket.mockReturnValue({ uploadToSignedUrl: mocks.upload });
  mocks.table.mockImplementation(() => { throw new Error('Direct table access is forbidden'); });
});

describe('authentication initialization and isolation', () => {
  it('disables selection until initial identity resolves, then enables normal submission', async () => {
    const initial = deferred();
    mocks.getUser.mockReturnValueOnce(initial.promise);
    const view = await mount();
    expect(view.container.querySelector('input').disabled).toBe(true);
    expect(uploadButton().disabled).toBe(true);
    initial.resolve(userResult('owner-a'));
    await flush();
    expect(view.container.querySelector('input').disabled).toBe(false);
    choose(view);
    expect(uploadButton().disabled).toBe(false);
  });

  it.each(['SIGNED_OUT', 'SIGNED_IN'])('does not overwrite a newer %s event with a stale initial lookup', async (event) => {
    const initial = deferred();
    mocks.getUser.mockReturnValueOnce(initial.promise);
    const view = await mount();
    await emit(event, event === 'SIGNED_OUT' ? null : 'owner-b');
    initial.resolve(userResult('owner-a'));
    await flush();
    if (event === 'SIGNED_OUT') expect(view.container.querySelector('input').disabled).toBe(true);
    else {
      choose(view);
      fireEvent.click(uploadButton());
      await flush();
      expect(mocks.prepare).toHaveBeenCalledTimes(1);
    }
  });

  it('fails closed on rejected initial authentication', async () => {
    mocks.getUser.mockRejectedValueOnce(new Error('mock authentication failure'));
    const view = await mount();
    expect(view.container.querySelector('input').disabled).toBe(true);
    expect(mocks.prepare).not.toHaveBeenCalled();
  });

  it('ignores the discarded StrictMode setup lookup after the replacement setup resolves', async () => {
    const discarded = deferred();
    const current = deferred();
    mocks.getUser.mockReturnValueOnce(discarded.promise).mockReturnValueOnce(current.promise);
    const view = await mount({ strict: true });
    current.resolve(userResult('owner-a'));
    await flush();
    discarded.resolve(userResult('owner-b'));
    await flush();
    choose(view);
    fireEvent.click(uploadButton());
    await flush();
    expect(mocks.prepare).toHaveBeenCalledTimes(1);
  });

  it.each(['prepare', 'upload', 'finalize'])('preserves same-owner refresh during %s', async (stage) => {
    const { pending } = await startPending(stage);
    await emit('TOKEN_REFRESHED', 'owner-a');
    pending.resolve(stage === 'prepare' ? preparedResult() : stage === 'upload' ? { error: null } : finalizedResult());
    await flush();
    expect(mocks.finalize).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Uploaded')).toBeTruthy();
  });

  it('preserves ownership during a refresh racing with the per-operation user lookup', async () => {
    const view = await mount();
    const lookup = deferred();
    mocks.getUser.mockReturnValueOnce(lookup.promise);
    choose(view);
    fireEvent.click(uploadButton());
    await emit('TOKEN_REFRESHED', 'owner-a');
    lookup.resolve(userResult('owner-a'));
    await flush();
    expect(mocks.finalize).toHaveBeenCalledTimes(1);
  });

  it.each(['prepare', 'upload', 'finalize'])('isolates owner A from B during pending %s and stale settlement', async (stage) => {
    const { view, pending } = await startPending(stage);
    await emit('SIGNED_IN', 'owner-b');
    expect(screen.queryByText(FILENAME)).toBeNull();
    expect(view.container.textContent).not.toContain(WORKSPACE_A);
    expect(view.container.textContent).not.toContain(RECOVERY);
    expect(screen.getByText(/An earlier request is still settling/)).toBeTruthy();
    expect(uploadButton().disabled).toBe(true);
    pending.resolve(stage === 'prepare' ? preparedResult() : stage === 'upload' ? { error: null } : finalizedResult());
    await flush();
    expect(view.container.textContent).not.toContain(FILENAME);
    expect(view.container.textContent).not.toContain(WORKSPACE_A);
    expect(view.container.textContent).not.toContain(RECOVERY);
    expect(mocks.upload).toHaveBeenCalledTimes(stage === 'prepare' ? 0 : 1);
    expect(mocks.finalize).toHaveBeenCalledTimes(stage === 'finalize' ? 1 : 0);
    choose(view, fixture('owner-b.csv'));
    expect(uploadButton().disabled).toBe(false);
    await emit('SIGNED_IN', 'owner-a');
    expect(view.container.textContent).toContain(RECOVERY);
    expect(view.container.textContent).toContain(DOCUMENT_ID);
  });

  it('does not restore old ownership when A signs out and returns before preparation settles', async () => {
    const { view, pending } = await startPending('prepare');
    await emit('SIGNED_OUT', null);
    await emit('SIGNED_IN', 'owner-a');
    pending.resolve(preparedResult());
    await flush();
    expect(mocks.upload).not.toHaveBeenCalled();
    expect(view.container.textContent).toContain(RECOVERY);
  });

  it('clears prior-owner validation errors and selection on account change', async () => {
    const view = await mount();
    choose(view, fixture(FILENAME, 'text/plain'));
    fireEvent.click(uploadButton());
    expect(screen.getByText(/Choose a supported document/)).toBeTruthy();
    await emit('SIGNED_IN', 'owner-b');
    expect(screen.queryByText(/Choose a supported document/)).toBeNull();
    expect(screen.queryByText(FILENAME)).toBeNull();
  });
});

describe('upload lifecycle and recovery', () => {
  it('guards two synchronous clicks and preserves exact backend payloads', async () => {
    const pending = deferred();
    mocks.prepare.mockReturnValueOnce(pending.promise);
    const view = await mount();
    const file = choose(view);
    const button = uploadButton();
    act(() => { button.click(); button.click(); });
    await flush();
    expect(mocks.prepare).toHaveBeenCalledTimes(1);
    expect(mocks.prepare).toHaveBeenCalledWith({ workspaceId: WORKSPACE_A, file: { name: FILENAME, mimeType: 'text/csv', sizeBytes: 27 } });
    pending.resolve(preparedResult());
    await flush();
    expect(mocks.bucket).toHaveBeenCalledWith('financial-documents');
    expect(mocks.upload).toHaveBeenCalledExactlyOnceWith('mock/canonical/synthetic.csv', 'mock-only-capability', file, { contentType: 'text/csv' });
    expect(mocks.finalize).toHaveBeenCalledExactlyOnceWith({ workspaceId: WORKSPACE_A, documentId: DOCUMENT_ID });
    expect(mocks.table).not.toHaveBeenCalled();
  });

  it.each(['prepare', 'upload', 'finalize'])('keeps original workspace binding and suppresses stale completion during %s', async (stage) => {
    const { view, pending } = await startPending(stage);
    await view.update({ workspaceId: WORKSPACE_B });
    expect(screen.getByText('Uploading...')).toBeTruthy();
    expect(uploadButton().disabled).toBe(true);
    pending.resolve(stage === 'prepare' ? preparedResult() : stage === 'upload' ? { error: null } : finalizedResult());
    await flush();
    expect(mocks.finalize).toHaveBeenCalledWith({ workspaceId: WORKSPACE_A, documentId: DOCUMENT_ID });
    expect(screen.queryByText('Uploaded')).toBeNull();
    act(() => vi.advanceTimersByTime(2000));
    expect(view.props.onClose).not.toHaveBeenCalled();
    choose(view);
    expect(uploadButton().disabled).toBe(false);
  });

  it.each(['prepare', 'upload', 'finalize'])('records uncertain %s without retry and retains owner/workspace filtering', async (stage) => {
    const { view, pending } = await startPending(stage);
    pending.reject(new Error('mock lost response'));
    await flush();
    expect(view.container.textContent).toContain(RECOVERY);
    if (stage !== 'prepare') expect(view.container.textContent).toContain(DOCUMENT_ID);
    choose(view);
    fireEvent.click(uploadButton());
    expect(mocks.prepare).toHaveBeenCalledTimes(1);
    await view.update({ isOpen: false });
    await view.update({ isOpen: true });
    expect(view.container.textContent).toContain(RECOVERY);
    await view.update({ workspaceId: WORKSPACE_B });
    expect(view.container.textContent).not.toContain(RECOVERY);
    expect(screen.getByText(FILENAME)).toBeTruthy();
    expect(uploadButton().disabled).toBe(false);
    await view.update({ workspaceId: WORKSPACE_A });
    expect(view.container.textContent).toContain(RECOVERY);
    expect(uploadButton().disabled).toBe(true);
  });

  it.each([null, '', '   ', 12])('does not invent a recovery ID from invalid preparation ID %s', async (id) => {
    mocks.prepare.mockResolvedValueOnce({ document: { id, status: 'PENDING_UPLOAD' } });
    const view = await mount();
    choose(view);
    fireEvent.click(uploadButton());
    await flush();
    expect(view.container.textContent).toContain(RECOVERY);
    expect(view.container.textContent).not.toContain('Document:');
    expect(mocks.upload).not.toHaveBeenCalled();
  });

  it('does not clear earlier recovery when another workspace completes an unrelated upload', async () => {
    const { view, pending } = await startPending('prepare');
    pending.reject(new Error('mock lost preparation'));
    await flush();
    await view.update({ workspaceId: WORKSPACE_B });
    choose(view, fixture('other-workspace.csv'));
    fireEvent.click(uploadButton());
    await flush();
    expect(screen.getByText('Uploaded')).toBeTruthy();
    await view.update({ workspaceId: WORKSPACE_A });
    expect(view.container.textContent).toContain(RECOVERY);
    expect(uploadButton().disabled).toBe(true);
  });

  it('freezes drop/replacement, then clears selected File and keeps green disabled success for 1.6 seconds', async () => {
    const { view, pending } = await startPending('prepare');
    const dropzone = view.container.querySelector('.border-dashed');
    const prevented = !fireEvent.drop(dropzone, { dataTransfer: { files: [fixture('replacement.csv')] } });
    expect(prevented).toBe(true);
    expect(screen.queryByText('replacement.csv')).toBeNull();
    expect(screen.getByRole('button', { name: 'Choose a different file' }).disabled).toBe(true);
    pending.resolve(preparedResult());
    await flush();
    expect(screen.queryByText(FILENAME)).toBeNull();
    expect(uploadButton().className).toContain('bg-emerald-500');
    expect(uploadButton().disabled).toBe(true);
    await emit('TOKEN_REFRESHED', 'owner-a');
    act(() => vi.advanceTimersByTime(1599));
    expect(view.props.onClose).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(view.props.onClose).toHaveBeenCalledTimes(1);
  });

  it.each(['modal', 'workspace', 'auth'])('invalidates a successful close timer after %s change', async (change) => {
    const view = await mount();
    choose(view);
    fireEvent.click(uploadButton());
    await flush();
    if (change === 'modal') { await view.update({ isOpen: false }); await view.update({ isOpen: true }); }
    if (change === 'workspace') await view.update({ workspaceId: WORKSPACE_B });
    if (change === 'auth') await emit('SIGNED_IN', 'owner-b');
    act(() => vi.advanceTimersByTime(2000));
    expect(view.props.onClose).not.toHaveBeenCalled();
    choose(view);
    expect(uploadButton().disabled).toBe(false);
  });

  it('keeps one pending operation across ordinary hide/reopen without another preparation', async () => {
    const { view, pending } = await startPending('prepare');
    await view.update({ isOpen: false });
    await view.update({ isOpen: true });
    fireEvent.click(uploadButton());
    expect(mocks.prepare).toHaveBeenCalledTimes(1);
    pending.resolve(preparedResult());
    await flush();
    expect(screen.queryByText('Uploaded')).toBeNull();
  });

  it('handles real StrictMode effect replay and unsubscribes on unmount', async () => {
    const view = await mount({ strict: true });
    expect(mocks.subscriptions.length).toBeGreaterThanOrEqual(2);
    expect(mocks.subscriptions[0].unsubscribe).toHaveBeenCalledTimes(1);
    expect(mocks.listeners.size).toBe(1);
    choose(view);
    fireEvent.click(uploadButton());
    await flush();
    expect(mocks.prepare).toHaveBeenCalledTimes(1);
    view.unmount();
    act(() => vi.advanceTimersByTime(2000));
    expect(mocks.listeners.size).toBe(0);
    expect(view.props.onClose).not.toHaveBeenCalled();
  });

  it('does not continue a preparation after unmount and late settlement', async () => {
    const { view, pending } = await startPending('prepare');
    view.unmount();
    pending.resolve(preparedResult());
    await flush();
    expect(mocks.upload).not.toHaveBeenCalled();
    expect(mocks.finalize).not.toHaveBeenCalled();
  });

  it('never unlocks or retries a never-settling request, even after owner/workspace change', async () => {
    const { view } = await startPending('prepare');
    await emit('SIGNED_IN', 'owner-b');
    await view.update({ workspaceId: WORKSPACE_B });
    act(() => vi.advanceTimersByTime(24 * 60 * 60 * 1000));
    expect(uploadButton().disabled).toBe(true);
    expect(screen.getByText(/earlier request is still settling/)).toBeTruthy();
    expect(mocks.prepare).toHaveBeenCalledTimes(1);
    expect(mocks.upload).not.toHaveBeenCalled();
  });
});

describe('unchanged file validation', () => {
  it.each([
    ['pdf', 'application/pdf'], ['csv', 'text/csv'], ['csv', 'application/csv'],
    ['xls', 'application/vnd.ms-excel'], ['xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    ['png', 'image/png'], ['jpg', 'image/jpeg'], ['jpeg', 'image/jpeg'],
  ])('accepts %s / %s at exactly 10 MiB', async (extension, mime) => {
    const view = await mount();
    choose(view, fixture(`boundary.${extension}`, mime, 10485760));
    fireEvent.click(uploadButton());
    await flush();
    expect(mocks.prepare).toHaveBeenCalledWith({ workspaceId: WORKSPACE_A, file: { name: `boundary.${extension}`, mimeType: mime, sizeBytes: 10485760 } });
  });

  it.each([
    [FILENAME, 'text/csv', 0], [FILENAME, 'text/csv', 10485761],
    [FILENAME, 'text/plain', 27], [FILENAME, '', 27], ['bad.exe', 'text/csv', 27], ['bad.pdf', 'image/png', 27],
  ])('rejects invalid fixture %s / %s / %s before preparation', async (name, type, size) => {
    const view = await mount();
    choose(view, fixture(name, type, size));
    fireEvent.click(uploadButton());
    await flush();
    expect(mocks.prepare).not.toHaveBeenCalled();
    expect(screen.getByText(/Choose a supported document/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Choose a different file' }));
    choose(view);
    expect(uploadButton().disabled).toBe(false);
  });

  it('rejects missing workspace before preparation', async () => {
    const view = await mount({ workspaceId: null });
    choose(view);
    fireEvent.click(uploadButton());
    expect(mocks.prepare).not.toHaveBeenCalled();
    expect(screen.getByText(/Select a workspace and document/)).toBeTruthy();
  });
});
