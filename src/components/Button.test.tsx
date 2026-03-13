import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "./Button";

describe("Button 组件", () => {
  it("应该正确渲染默认按钮", () => {
    render(<Button>点击我</Button>);
    expect(screen.getByText("点击我")).toBeInTheDocument();
  });

  it("应该处理点击事件", () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>点击我</Button>);
    fireEvent.click(screen.getByText("点击我"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("应该渲染不同变体", () => {
    const { rerender } = render(<Button variant="default">默认</Button>);
    expect(screen.getByText("默认")).toBeInTheDocument();

    rerender(<Button variant="destructive">危险</Button>);
    expect(screen.getByText("危险")).toBeInTheDocument();

    rerender(<Button variant="outline">轮廓</Button>);
    expect(screen.getByText("轮廓")).toBeInTheDocument();

    rerender(<Button variant="ghost">幽灵</Button>);
    expect(screen.getByText("幽灵")).toBeInTheDocument();

    rerender(<Button variant="link">链接</Button>);
    expect(screen.getByText("链接")).toBeInTheDocument();
  });

  it("应该禁用按钮", () => {
    render(<Button disabled>禁用</Button>);
    expect(screen.getByText("禁用")).toBeDisabled();
  });

  it("应该支持不同尺寸", () => {
    const { rerender } = render(<Button size="default">默认</Button>);
    expect(screen.getByText("默认")).toBeInTheDocument();

    rerender(<Button size="sm">小</Button>);
    expect(screen.getByText("小")).toBeInTheDocument();

    rerender(<Button size="lg">大</Button>);
    expect(screen.getByText("大")).toBeInTheDocument();

    rerender(<Button size="icon">图标</Button>);
    expect(screen.getByText("图标")).toBeInTheDocument();
  });

  it("应该支持自定义 className", () => {
    render(<Button className="custom-class">自定义</Button>);
    expect(screen.getByText("自定义")).toHaveClass("custom-class");
  });

  it("应该支持 ref 转发", () => {
    const ref = { current: null as HTMLButtonElement | null };
    render(<Button ref={ref}>带ref</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it("应该显示 displayName", () => {
    expect(Button.displayName).toBe("Button");
  });
});
