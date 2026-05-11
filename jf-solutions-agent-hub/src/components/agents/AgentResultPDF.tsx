import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer"

export interface AgentResultPDFProps {
  agentLabel: string
  clientName: string
  projectName: string
  generatedAt: string
  content: string
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#FAF9F6",
    paddingVertical: 48,
    paddingHorizontal: 56,
    fontFamily: "Helvetica",
  },
  header: {
    borderBottom: "2px solid #0E0E0E",
    paddingBottom: 16,
    marginBottom: 28,
  },
  tag: {
    fontSize: 8,
    color: "#BD8130",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    color: "#0E0E0E",
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    color: "#4A4A4A",
    marginBottom: 2,
  },
  date: {
    fontSize: 9,
    color: "#8A8A8A",
    letterSpacing: 0.5,
  },
  body: {
    fontSize: 10,
    color: "#0E0E0E",
    lineHeight: 1.7,
  },
  heading: {
    fontSize: 11,
    color: "#BD8130",
    fontFamily: "Helvetica-Bold",
    marginTop: 16,
    marginBottom: 6,
    paddingBottom: 3,
    borderBottom: "1px solid #E5E4E0",
  },
  bullet: {
    fontSize: 10,
    color: "#0E0E0E",
    lineHeight: 1.6,
    marginLeft: 8,
    marginBottom: 2,
  },
  footer: {
    position: "absolute",
    bottom: 32,
    left: 56,
    right: 56,
    borderTop: "1px solid #E5E4E0",
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 8,
    color: "#8A8A8A",
  },
})

function renderContent(content: string) {
  const lines = content.split("\n")
  const elements: React.ReactElement[] = []

  lines.forEach((line, i) => {
    if (line.startsWith("## ")) {
      elements.push(
        <Text key={i} style={styles.heading}>
          {line.replace(/^## /, "").replace(/\*\*/g, "")}
        </Text>
      )
    } else if (line.startsWith("- ")) {
      elements.push(
        <Text key={i} style={styles.bullet}>
          • {line.replace(/^- /, "").replace(/\*\*/g, "")}
        </Text>
      )
    } else if (line.trim() !== "") {
      elements.push(
        <Text key={i} style={styles.body}>
          {line.replace(/\*\*/g, "")}
        </Text>
      )
    }
  })

  return elements
}

export default function AgentResultPDF({
  agentLabel,
  clientName,
  projectName,
  generatedAt,
  content,
}: AgentResultPDFProps) {
  return (
    <Document
      title={`${agentLabel} — ${projectName}`}
      author="JF Solutions"
      subject={`Resultado agente: ${agentLabel}`}
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.tag}>JF Solutions — {agentLabel}</Text>
          <Text style={styles.title}>{projectName}</Text>
          <Text style={styles.subtitle}>{clientName}</Text>
          <Text style={styles.date}>Generado el {generatedAt}</Text>
        </View>

        {renderContent(content)}

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>JF Solutions Agency</Text>
          <Text style={styles.footerText}>{agentLabel}</Text>
        </View>
      </Page>
    </Document>
  )
}
