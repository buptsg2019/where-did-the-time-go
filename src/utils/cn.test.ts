import { describe, it, expect } from "vitest";
import { cn } from "./cn";

describe("cn 工具函数", () => {
  it("应该合并 Tailwind 类名", () => {
    expect(cn("px-2", "py-4")).toBe("px-2 py-4");
  });

  it("应该处理条件类名", () => {
    const isActive = true;
    expect(cn("base", isActive && "active")).toBe("base active");
  });

  it("应该解决冲突类名", () => {
    // px-2 和 px-4 冲突，后者优先
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("应该过滤 falsy 值", () => {
    expect(cn("base", null, undefined, false, "extra")).toBe("base extra");
  });

  it("应该正确处理 clsx 数组语法", () => {
    expect(cn(["class1", "class2"])).toBe("class1 class2");
  });

  it("应该正确处理对象语法", () => {
    expect(cn({ active: true, disabled: false })).toBe("active");
  });

  it("应该正确处理嵌套数组", () => {
    expect(cn("base", ["class1", ["class2"]])).toBe("base class1 class2");
  });
});
