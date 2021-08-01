#!/usr/bin/env node
import React, { FC } from "react";
import { render, Text } from "ink";

const App: FC<{ name?: string }> = ({ name = "Stranger" }) => (
	<Text>
		Hello, <Text color="green">{name}</Text>
	</Text>
);

render(<App name={"Jane"} />);
