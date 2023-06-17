import Head from "next/head";
import Image from "next/image";
import { Inter } from "next/font/google";
import styles from "@/styles/Home.module.css";
import Web3Modal from "web3modal";
import { providers, Contract } from "ethers";
import { useEffect, useRef, useState } from "react";
import { MY_CONTRACT_ADDRESS, abi } from "../constants";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  const [walletConnected, setWalletConnected] = useState(false);

  const [loading, setLoading] = useState(false);
  const [loading2, setLoading2] = useState(false);

  const [sentenceWritten, setSentenceWritten] = useState("Write here!");
  const [theStoredSen, getTheStoredSen] = useState("");

  const web3ModalRef = useRef();

  const connectWallet = async () => {
    try {
      // Get the provider from web3Modal, which in our case is MetaMask
      // When used for the first time, it prompts the user to connect their wallet
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (err) {
      console.error(err);
    }
  };

  const getProviderOrSigner = async (needSigner = false) => {
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    // If user is not connected to the Sepolia network, let them know and throw an error
    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 11155111) {
      window.alert("Change the network to Sepolia");
      throw new Error("Change network to Sepolia");
    }

    if (needSigner) {
      return web3Provider.getSigner();
    }
    return web3Provider;
  };

  useEffect(() => {

    const initializeWeb3Modal = () => {
      web3ModalRef.current = new Web3Modal({
        network: "sepolia",
        providerOptions: {},
        disableInjectedProvider: false,
      });
    };

    if (!walletConnected) {
      initializeWeb3Modal();
      connectWallet();
    }
  }, [walletConnected]);

  const setTheSentence = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      // Create a new instance of the Contract with a Signer
      const simpleStorageContract = new Contract(
        MY_CONTRACT_ADDRESS,
        abi,
        signer
      );
      // call the setSentence function from the contract
      const tx = await simpleStorageContract.setSentence(sentenceWritten);
      setLoading(true);
      await tx.wait();
      setLoading(false);
    } catch (err) {
      console.error(err);
    }
  };

  const getMySentence = async () => {
    try {
      setLoading2(true);
      const provider = await getProviderOrSigner();
      const simpleStorageContract = new Contract(
        MY_CONTRACT_ADDRESS,
        abi,
        provider
      );
      const _sentenceStored = await simpleStorageContract
        .getSentence()
        .catch((error) => {
          console.error("Revert reason:", error.reason);
        });
      getTheStoredSen(_sentenceStored);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading2(false);
    }
  };

  const renderButton = () => {
    if (walletConnected) {
      if (loading) {
        return <button className={styles.button}>Loading...</button>;
      } else {
        return (
          <button
            onClick={setTheSentence}
            style={{ cursor: "pointer", backgroundColor: "blue" }}
          >
            Submit
          </button>
        );
      }
    } else {
      return (
        <button
          style={{ cursor: "pointer", backgroundColor: "blue" }}
          onClick={connectWallet}
        >
          Connect your wallet
        </button>
      );
    }
  };

  return (
    <div>
      <Head>
        <title>Contract Storage</title>
        <meta name="description" content="Storage-Dapp" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/logo-charmingdata-small.ico" />
<style type="text/css">
    .box{display:block;}
    </style>
    </Head>
      <main className={`${styles.main} ${inter.className}`}>


        <div>
          <h1 className={styles.title}>Welcome to the Contract storage!</h1>
          <div className={styles.description}>
            This smart contract can record any text on the blockchain for life.
          </div>
          <br></br>
          <div>
            <label>Write Your Sentence: </label>
            <input
              type="text" name="box"
              value={sentenceWritten}
              onChange={(e) => setSentenceWritten(e.target.value)}
              style={{ marginRight: ".5rem" }}
            />
            {renderButton()}
          </div>
          <br></br>
          <div>
            <button
              style={{ cursor: "pointer", backgroundColor: "blue" }}
              onClick={getMySentence}
            >
              Get Stored Text
            </button>
            {loading2 ? <p>Loading...</p> : <p>{theStoredSen}</p>}
          </div>
        </div>


      </main>
    </div>
  );
}
