import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TagInput } from "@/components/shared/tag-input";

describe("TagInput", () => {
  it("renders existing tags as badges", () => {
    const onChange = vi.fn();
    render(
      <TagInput value={["literacy", "math", "edtech"]} onChange={onChange} />
    );
    expect(screen.getByText("literacy")).toBeInTheDocument();
    expect(screen.getByText("math")).toBeInTheDocument();
    expect(screen.getByText("edtech")).toBeInTheDocument();
  });

  it("adds tag on Enter", () => {
    const onChange = vi.fn();
    render(<TagInput value={[]} onChange={onChange} />);
    const input = screen.getByPlaceholderText("Add tags...");
    fireEvent.change(input, { target: { value: "newtag" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith(["newtag"]);
  });

  it("adds tag on comma", () => {
    const onChange = vi.fn();
    render(<TagInput value={[]} onChange={onChange} />);
    const input = screen.getByPlaceholderText("Add tags...");
    fireEvent.change(input, { target: { value: "another" } });
    fireEvent.keyDown(input, { key: "," });
    expect(onChange).toHaveBeenCalledWith(["another"]);
  });

  it("removes tag on X click", () => {
    const onChange = vi.fn();
    render(
      <TagInput value={["tag1", "tag2"]} onChange={onChange} />
    );
    const removeButton = screen.getByLabelText("Remove tag1");
    fireEvent.click(removeButton);
    expect(onChange).toHaveBeenCalledWith(["tag2"]);
  });

  it("doesn't add duplicate tags", () => {
    const onChange = vi.fn();
    render(<TagInput value={["existing"]} onChange={onChange} />);
    const input = screen.getByPlaceholderText("");
    fireEvent.change(input, { target: { value: "existing" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("respects maxTags limit", () => {
    render(
      <TagInput value={["a", "b"]} onChange={vi.fn()} maxTags={2} />
    );
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("adds tag when under maxTags limit", () => {
    const onChange = vi.fn();
    render(
      <TagInput value={["a"]} onChange={onChange} maxTags={3} />
    );
    const input = screen.getByPlaceholderText("");
    fireEvent.change(input, { target: { value: "b" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith(["a", "b"]);
  });
});
