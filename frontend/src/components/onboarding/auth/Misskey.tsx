import {
	TextInput,
	Text,
	Select,
	Button,
	Box,
	Flex,
	Loader,
	Drawer,
	Image,
} from "@mantine/core";
import { MastadonWorker } from "../../../services/mastadon-worker.service";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconX } from "@tabler/icons-react";
import { useState } from "react";
import { MastadonService } from "../../../services/mastadon.service";
import ClickToPaste from "../../utils/ClickToPaste";
import { TextTitle } from "../../../styles/Mastodon";
import MisskeyLogo from "../../../assets/icons/Logo_Misskey.svg";

import { v4 as uuidv4 } from "uuid";

function MisskeyOnboarding() {
	const [AuthToken, setAuthToken] = useState("");

	const [IsDrawerProcessing, setIsDrawerProcessing] = useState(false);
	const [MastadonServerURL, setMastadonServerURL] = useState("");
	const [DrawerOpen, setDrawerOpen] = useState(false);

	async function onLoginAttempt() {
		const serverUrl = MastadonServerURL;
		MastadonService.fetchCode(serverUrl);
		setDrawerOpen(true);
	}

	function closeDrawer() {
		setDrawerOpen(false);
	}

	async function onVerificationStart() {
		setIsDrawerProcessing(true);
		try {
			const res = await MastadonService.verifyAccessToken(
				MastadonServerURL,
				AuthToken
			);

			if (!res) {
				setIsDrawerProcessing(false);
				notifications.show({
					id: "mastadon-auth-failure",
					color: "red",
					title: "Could not log in",
					message: `[ERROR]: possibly pasted token was incorrect`,
					icon: <IconX />,
					autoClose: 10000,
				});
				return;
			}

			const obj = await MastadonService.verifyCredentials(
				MastadonServerURL,
				res
			);
			if (!obj) {
				setIsDrawerProcessing(false);
				notifications.show({
					id: "mastadon-auth-failure",
					color: "red",
					title: "Could not log in",
					message: `[ERROR]: failed to obtain profile data.`,
					icon: <IconX />,
					autoClose: 10000,
				});
				return;
			}
			const { success: onboardSuccess, error: onboardError } =
				await MastadonWorker.onboardUser(MastadonServerURL, obj);

			if (!onboardSuccess) {
				notifications.show({
					id: "mastadon-auth-failure",
					color: "red",
					title: "Could not log in",
					message: `[ERROR]: ${onboardError}`,
					icon: <IconX />,
					autoClose: 10000,
				});
			} else {
				notifications.show({
					id: "mastadon-auth-success",
					color: "teal",
					title: "Account Updated Successfully",
					message: (
						<Text>
							You can now log into <b>{MastadonServerURL}</b> as{" "}
							<b>{obj.username}</b>
						</Text>
					),
					icon: <IconCheck />,
					autoClose: 5000,
				});
			}
		} finally {
			setIsDrawerProcessing(false);
			setDrawerOpen(false);
		}
	}

	return (
		<Box>
			<TextTitle my={"md"}>Step 1: Select your Misskey instance</TextTitle>
			<Flex>
				<Select
					searchable
					clearable
					onSearchChange={setMastadonServerURL}
					style={{ flexGrow: 1 }}
					placeholder="https://mastodon.social"
					data={popularMastadonServers}
					filter={(value, item) =>
						item.url.toLowerCase().includes(value.toLowerCase().trim())
					}
				/>
				<TextInput
					disabled
					value={`/oauth/<session>`}
					style={{ flexShrink: 1 }}
					mx={"md"}
					maw={148}
				/>
				<Button onClick={onLoginAttempt}>Next</Button>
			</Flex>
			<TextTitle my={"md"}>Step 2: Paste your token here</TextTitle>

			<Flex w={"100%"}>
				<TextInput
					data-autofocus
					placeholder="Paste token obtained from browser here..."
					miw={"lg"}
					value={AuthToken}
					onChange={(e) => {
						setAuthToken(e.currentTarget.value);
					}}
					style={{ flexGrow: 1 }}
				/>
				<Button ml={"md"} style={{ flexShrink: 1 }} onClick={onLoginAttempt}>
					Next
				</Button>
			</Flex>
			<Drawer
				position="bottom"
				opened={DrawerOpen}
				onClose={closeDrawer}
				size={"md"}
			>
				<Flex justify={"center"} align={"center"} direction={"column"}>
					<Text size={32}>Mastadon Server Authentication</Text>
					<Flex
						py={"md"}
						align={"center"}
						justify={"center"}
						style={{ alignItems: "center" }}
					>
						<TextInput
							data-autofocus
							placeholder="Paste token obtained from browser here..."
							size={"md"}
							miw={"lg"}
							value={AuthToken}
							onChange={(e) => {
								setAuthToken(e.currentTarget.value);
							}}
						/>
						<ClickToPaste
							callback={() => {
								navigator.clipboard.readText().then((text) => {
									setAuthToken(text);
								});
							}}
							displayText="Pasted clipboard content !"
							size={32}
						/>
						<Button
							onClick={onVerificationStart}
							disabled={IsDrawerProcessing}
							size={"md"}
						>
							{IsDrawerProcessing ? (
								<Loader color="#fff" size={20} />
							) : (
								"Verify"
							)}
						</Button>
					</Flex>
				</Flex>
			</Drawer>
		</Box>
	);
}

const popularMastadonServers = [
	{
		value: "https://mastodon.social",
		label: "https://mastodon.social",
		displayname: "Mastadon",
		url: "https://mastodon.social",
		nsfw: false,
	},
	{
		value: "https://baraag.net",
		label: "https://baraag.net",
		displayname: "🔞 baraag.net",
		url: "https://baraag.net",
		nsfw: true,
	},
	{
		value: "https://mstdn.social",
		label: "https://mstdn.social",
		displayname: "Mastodon 🐘",
		url: "https://mstdn.social",
		nsfw: false,
	},
	{
		value: "https://pawoo.net",
		label: "https://pawoo.net",
		displayname: "Pawoo",
		url: "https://pawoo.net",
		nsfw: false,
		languages: ["jp"],
	},
	{
		value: "https://mstdn.jp",
		label: "https://mstdn.jp",
		displayname: "mstdn.jp",
		url: "https://mstdn.jp",
		nsfw: false,
		languages: ["jp"],
	},
];

export default MisskeyOnboarding;
