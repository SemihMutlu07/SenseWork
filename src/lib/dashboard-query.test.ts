import { describe, expect, it } from "vitest";
import { parseDashboardQuery } from "@/lib/dashboard-query";

describe("dashboard URL query parsing", () => {
  it("parses valid pagination and age filters", () => {
    expect(
      parseDashboardQuery(
        new URLSearchParams("page=2&minAge=20&maxAge=30"),
      ),
    ).toEqual({
      page: 2,
      pageSize: 10,
      minAge: 20,
      maxAge: 30,
    });
  });

  it("does not crash on malformed params", () => {
    expect(parseDashboardQuery(new URLSearchParams("page=abc"))).toEqual({
      page: 1,
      pageSize: 10,
      minAge: null,
      maxAge: null,
    });

    expect(parseDashboardQuery(new URLSearchParams("page=-1"))).toEqual({
      page: 1,
      pageSize: 10,
      minAge: null,
      maxAge: null,
    });

    expect(parseDashboardQuery(new URLSearchParams("minAge=foo"))).toEqual({
      page: 1,
      pageSize: 10,
      minAge: null,
      maxAge: null,
    });
  });

  it("clears inverted age ranges instead of crashing", () => {
    expect(
      parseDashboardQuery(new URLSearchParams("minAge=50&maxAge=20")),
    ).toEqual({
      page: 1,
      pageSize: 10,
      minAge: null,
      maxAge: null,
    });
  });
});
