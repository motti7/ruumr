import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import MatchCard from "@/components/matches/MatchCard";

vi.mock("@/components/shared/SmartImage", () => ({
  default: ({ alt }) => <img alt={alt} />,
}));

const match = {
  name: "נועה",
  age: 28,
  location: "תל אביב",
  budget_max: 5000,
  photos: [],
};
const handlers = {
  onClickProfile: vi.fn(),
  onClickChat: vi.fn(),
  onClickCharter: vi.fn(),
  onDelete: vi.fn(),
};

describe("MatchCard match type", () => {
  it("labels a one-sided Ruumr Plus match", () => {
    render(
      <MatchCard
        match={match}
        matchId="match-plus"
        matchType="ruumr_plus"
        {...handlers}
      />
    );

    expect(screen.getByText("התאמת Ruumr Plus")).toBeInTheDocument();
    expect(screen.getByRole("article")).toHaveAccessibleName(
      expect.stringContaining("התאמת Ruumr Plus")
    );
  });

  it("does not show the Plus badge for a mutual match", () => {
    render(
      <MatchCard
        match={match}
        matchId="match-mutual"
        matchType="mutual"
        {...handlers}
      />
    );

    expect(screen.queryByText("התאמת Ruumr Plus")).not.toBeInTheDocument();
    expect(screen.getByRole("article")).toHaveAccessibleName(
      expect.stringContaining("התאמה הדדית")
    );
  });
});
