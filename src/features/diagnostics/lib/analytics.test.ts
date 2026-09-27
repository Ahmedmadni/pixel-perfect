import { describe, expect, it } from "vitest";
import { sortDiagnostics, summarizeDiagnostics } from "./analytics";
import type { DiagnosticSeverity, DiagnosticStatus } from "../services/diagnostics.service";

const issue=(status:DiagnosticStatus,severity:DiagnosticSeverity,date="2026-09-01")=>({status,severity,first_detected_date:date});

describe("diagnostic analytics",()=>{
  it("summarizes active, returned, critical and resolved issues",()=>{
    const result=summarizeDiagnostics([
      issue("open","critical"),
      issue("monitoring","medium"),
      issue("returned","high"),
      issue("resolved","critical"),
    ]);
    expect(result).toEqual({total:4,active:3,returned:1,critical:1,resolved:1});
  });

  it("prioritizes returned issues before open and resolved",()=>{
    const sorted=sortDiagnostics([
      issue("resolved","critical","2026-09-20"),
      issue("open","medium","2026-09-21"),
      issue("returned","low","2026-09-01"),
    ]);
    expect(sorted.map(x=>x.status)).toEqual(["returned","open","resolved"]);
  });

  it("prioritizes severity within the same status",()=>{
    const sorted=sortDiagnostics([
      issue("open","low"),
      issue("open","critical"),
      issue("open","high"),
    ]);
    expect(sorted.map(x=>x.severity)).toEqual(["critical","high","low"]);
  });
});
