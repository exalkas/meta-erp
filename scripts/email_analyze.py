import openai
import json

def classify_and_summarize(ticket_text):
    prompt = f"""
    Summarize the following support ticket and classify it:
    Ticket: {ticket_text}

    Respond in JSON:
    {{
        "summary": "...",
        "type": "bug" | "feature" | "billing"
    }}
    """
    
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}]
    )

    result = json.loads(response.choices[0].message['content'])
    return result

# Example usage
ticket = "My invoice says I owe $500, but I already paid."
print(classify_and_summarize(ticket))