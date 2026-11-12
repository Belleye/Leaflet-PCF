# Import the solution into Power Apps

A release solution ZIP will be added soon. Until then, contributors can [build the solution locally](development.md#packaging-and-deployment). The build produces `solution/bin/Release/solution.zip` (unmanaged, for development) and `solution_managed.zip` (managed installation).

1. In [Power Apps](https://make.powerapps.com/), select the target environment and open **Solutions**.
2. Choose **Import solution**, select the appropriate solution ZIP, and follow the import prompts.
3. Ensure the environment permits **Power Apps component framework for canvas apps**.
4. Open your Canvas app in Studio and follow [Build a Canvas app with the map](building.md) to add and configure the component.

Building a package locally does not import it or change an environment.
