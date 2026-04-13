import type {
  Signal,
  SignalDistrict,
  SignalDistrictExpanded,
  SignalMatch,
  SignalMatchWithSignal,
} from "@/types/database";

/** Raw row from PostgREST when embedding `lea_directory` under `signal_districts`. */
export type SignalDistrictWithLea = SignalDistrict & {
  lea_directory: { name: string; state: string } | null;
};

const DISTRICT_LABEL = (name: string, state: string) =>
  name && state ? `${name} (${state})` : name || state || "";

export function expandSignalDistrictsNested(
  rows: SignalDistrictWithLea[] | null | undefined
): SignalDistrictExpanded[] {
  if (!rows?.length) return [];
  return rows.map((sd) => {
    const { lea_directory, ...rest } = sd;
    const name = lea_directory?.name ?? "";
    const state = lea_directory?.state ?? "";
    return {
      ...rest,
      district_name: name,
      district_state: state,
      district_label: DISTRICT_LABEL(name, state),
    };
  });
}

export type SignalWithNestedDistricts = Signal & {
  signal_districts?: SignalDistrictWithLea[] | null;
};

export function expandNestedDistrictsOnSignal<T extends SignalWithNestedDistricts>(
  signal: T
): Omit<T, "signal_districts"> & { signal_districts: SignalDistrictExpanded[] } {
  return {
    ...signal,
    signal_districts: expandSignalDistrictsNested(signal.signal_districts ?? undefined),
  };
}

export function expandNestedDistrictsOnMatches(
  matches: Array<SignalMatch & { signal: SignalWithNestedDistricts | null }>
): SignalMatchWithSignal[] {
  return matches.map((m) => {
    if (!m.signal) return m as SignalMatchWithSignal;
    return {
      ...m,
      signal: expandNestedDistrictsOnSignal(m.signal),
    } as SignalMatchWithSignal;
  });
}
