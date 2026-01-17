import streamlit as st

st.set_page_config(layout="wide")

st.markdown("""
    <style>
        /* Supprime les marges par défaut de Streamlit */
        .block-container {
            padding-top: 1rem;
            padding-bottom: 0rem;
            padding-left: 1rem;
            padding-right: 1rem;
        }
        /* Cache le menu hamburger et le footer interne 'Made with Streamlit' */
        #MainMenu {visibility: hidden;}
        footer {visibility: hidden;}
        header {visibility: hidden;}
    </style>
""", unsafe_allow_html=True)

st.title("Hello World")
st.write("Welcome!")

