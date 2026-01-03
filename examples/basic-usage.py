"""
Basic usage example of PLP client
"""

import os
from plp_client import PLPClient, PromptInput

def main():
    # Initialize client
    client = PLPClient(
        "https://prompts.goreal.ai",
        api_key=os.getenv("PLP_API_KEY")  # Optional
    )

    try:
        # Create a new prompt
        print("Creating prompt...")
        client.put("examples/greeting", PromptInput(
            content="Hello {{name}}, welcome to {{product}}!",
            meta={
                "version": "1.0.0",
                "author": "demo",
                "description": "A simple greeting prompt"
            }
        ))

        # Retrieve the prompt
        print("Retrieving prompt...")
        prompt = client.get("examples/greeting")
        print(f"Prompt content: {prompt.content}")
        print(f"Prompt version: {prompt.meta.get('version')}")

        # Use the prompt with variables
        message = prompt.content\
            .replace("{{name}}", "Alice")\
            .replace("{{product}}", "PLP")
        print(f"Final message: {message}")

        # Clean up
        print("Deleting prompt...")
        client.delete("examples/greeting")

        print("✅ Done!")

    except Exception as e:
        print(f"Error: {e}")
        exit(1)

if __name__ == "__main__":
    main()
