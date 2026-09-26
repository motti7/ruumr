# Blocked-conversation cleanup workflow

This app uses Base44 Workflows. The retry schedule is defined in `base44/workflows/Retry blocked conversation deletion.jsonc`, not in the legacy function.jsonc automations array. This corrects the scheduled-automation instructions in user-safety.md.

The workflow calls cleanupUserBlocks every ten minutes. The function and its admin check are unchanged. The workflow must be created under an app administrator. Success of other administrator-owned workflows does not prove the identity or execution of this new workflow.

## Deployment and verification

The workflow file is executable configuration: importing or syncing it into the Base44 sandbox may register and activate it immediately. Do not treat GitHub merge or web publishing as an activation barrier.

Before importing, verify UserBlock exists, cleanupUserBlocks is deployed, and review the scope of existing cleanup_pending records. Activation processes existing pending records as well as future ones (at most twenty records per invocation). It can permanently delete messages and matches for blocked pairs; it does not delete profiles or reports. Keep Message permissions and the published chat version coordinated.

After sync, verify the workflow appears in the Workflows dashboard with a ten-minute schedule and administrator creator. Inspect an actual scheduled run: 403 means the creator/authentication requires attention. Verify pending cleanup completes using disposable accounts and messages. Do not remove the administrator check to work around an authentication failure.

Only local handler tests have verified injected cleanup failures and retries so far. Actual scheduled execution and deployed ordinary-user RLS still require verification. No live cleanup was triggered while preparing this configuration.
