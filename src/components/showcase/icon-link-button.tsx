"use client";

import { type LucideIcon } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type IconLinkButtonProps = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export function IconLinkButton({
  href,
  label,
  icon: Icon,
}: IconLinkButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <a
            className={cn(
              buttonVariants({ size: "icon-sm", variant: "outline" }),
              "rounded-full bg-background/70 backdrop-blur-sm hover:bg-secondary"
            )}
            href={href}
            target="_blank"
            rel="noreferrer"
          />
        }
      >
        <Icon className="size-4" />
        <span className="sr-only">{label}</span>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
