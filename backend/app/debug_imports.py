try:
    import langchain
    print(f"langchain: {langchain.__version__}")
    from langchain.chains import create_retrieval_chain
    print("create_retrieval_chain imported successfully")
except ImportError as e:
    print(f"ImportError: {e}")
except Exception as e:
    print(f"Error: {e}")
    
try:
    import langchain_community
    print(f"langchain_community: {langchain_community.__version__}")
except ImportError as e:
    print(f"ImportError: {e}")
