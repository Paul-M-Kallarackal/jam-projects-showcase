import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen px-4 py-10 md:px-6 md:py-16">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <Skeleton className="h-4 w-32 rounded-full bg-foreground/10" />
            <Skeleton className="h-16 w-full max-w-2xl rounded-4xl bg-foreground/10" />
            <Skeleton className="h-6 w-full max-w-xl rounded-full bg-foreground/10" />
            <Skeleton className="h-10 w-56 rounded-full bg-foreground/10" />
          </div>
          <Card className="surface-glass border-border/60 bg-card/80">
            <CardHeader>
              <Skeleton className="h-5 w-36 rounded-full bg-foreground/10" />
              <Skeleton className="h-10 w-full rounded-3xl bg-foreground/10" />
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Skeleton className="h-28 rounded-3xl bg-foreground/10" />
              <Skeleton className="h-28 rounded-3xl bg-foreground/10" />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="surface-glass border-border/60 bg-card/80">
              <CardContent className="space-y-4 pt-4">
                <Skeleton className="h-4 w-20 rounded-full bg-foreground/10" />
                <Skeleton className="h-8 w-16 rounded-full bg-foreground/10" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
