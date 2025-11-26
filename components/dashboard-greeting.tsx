interface DashboardGreetingProps {
  greeting: string;
  userName: string;
}

export function DashboardGreeting({ greeting, userName }: DashboardGreetingProps) {
  const firstName = userName.split(" ")[0];

  return (
    <div data-testid="dashboard-greeting">
      <h1 className="text-2xl font-bold tracking-tight">
        {greeting}, {firstName}!
      </h1>
      <p className="text-muted-foreground">
        Acompanhe seu desempenho e cotações
      </p>
    </div>
  );
}
