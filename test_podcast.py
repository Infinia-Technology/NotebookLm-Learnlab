import httpx
import asyncio

async def test():
    async with httpx.AsyncClient() as client:
        # We need a proper user token. Let's just hit the endpoint and see if we get a 401 or a 500
        r = await client.post('http://localhost:8000/api/knowledge/podcast', json={'document_ids': ['fake']}, timeout=10)
        print(r.status_code, r.text)

if __name__ == '__main__':
    asyncio.run(test())
