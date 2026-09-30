# Architecture rules
- Features live in `src/features/<name>/{components,hooks,services,schemas,lib}`; routes stay thin. Why: keeps pages free of logic.
- All data access goes through feature services that throw `DataProviderError` (`DATA_PROVIDER_NOT_CONNECTED` when no DB). Why: DB hookup is integration-only, no mock data.
- Odometer rules live in `src/features/odometer/lib/odometer-rules.ts`; DB trigger mirrors them. Why: single source of business logic.
- Prepared SQL lives in `database/migrations/` until Cloud is enabled. Why: supabase/migrations is tool-managed.
- The OBD-II code library is a shared read-only table (`obd_fault_codes`) refreshed by `scripts/import-obd-codes.mjs` via upsert on `code`. Why: reference data is global, not per-user, and the import must stay idempotent.
