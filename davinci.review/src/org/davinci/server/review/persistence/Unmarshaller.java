package org.davinci.server.review.persistence;

import java.io.File;

import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.LinkedList;
import java.util.List;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import javax.xml.transform.Result;
import javax.xml.transform.Source;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerException;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.TransformerFactoryConfigurationError;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;

import org.davinci.server.review.Comment;
import org.davinci.server.review.CommentFlag;
import org.davinci.server.review.CommentsDocument;
import org.davinci.server.review.Constants;
import org.davinci.server.review.DavinciProject;
import org.w3c.dom.DOMException;
import org.w3c.dom.Document;
import org.w3c.dom.NamedNodeMap;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.SAXException;

/**
 * 
 * Transform a XML document into a JAVA object.
 * 
 */
public class Unmarshaller {
	public CommentsDocument unmarshall(DavinciProject project) {
		String path = project.getCommentFilePath();
		CommentsDocument commentsDoc = new CommentsDocument(project);

		try {
			File f = new File(path);

			Document document = initCommentsFile(f);
			Node node = document.getFirstChild();
			NodeList children = node.getChildNodes();
			Comment comm;
			for (int i = 0; i < children.getLength(); i++) {
				node = children.item(i);
				if (node.getNodeType() == Node.ELEMENT_NODE
						&& CommentsDocument.COMMENT.equalsIgnoreCase(node
								.getNodeName())) {
					comm = unmarshallComment(node);
					if (null != comm) {
						comm.setProject(project);
						commentsDoc.getCommentList().add(comm);
					}
				}
			}
		} catch (Exception e) {
			e.printStackTrace();
		}
		return commentsDoc;
	}

	protected Comment unmarshallComment(Node commentNode) throws DOMException,
			ParseException {
		if (null == commentNode
				|| Node.ELEMENT_NODE != commentNode.getNodeType())
			return null;

		SimpleDateFormat sdf = new SimpleDateFormat(Constants.DATE_PATTERN);
		Comment comment = new Comment();
		Node node;

		NodeList children = commentNode.getChildNodes();
		for (int i = 0; i < children.getLength(); i++) {
			node = children.item(i);
			if (node.getNodeType() == Node.ELEMENT_NODE) {
				if (Comment.PAGE_STATE
						.equalsIgnoreCase(node.getNodeName()))
					comment.setPageState(getValue(node));
				else if (Comment.PAGE_NAME.equalsIgnoreCase(node.getNodeName()))
					comment.setPageName(getValue(node));
				else if (Comment.SUBJECT.equalsIgnoreCase(node.getNodeName()))
					comment.setSubject(getValue(node));
				else if (Comment.CONTENT.equalsIgnoreCase(node.getNodeName()))
					comment.setContent(getValue(node));
				else if (Comment.DRAWING_JSON.equalsIgnoreCase(node
						.getNodeName())) {
					comment.setDrawingJson(getValue(node));
				} else if (Comment.SEVERITY
						.equalsIgnoreCase(node.getNodeName())) {
					comment.setSeverity(getValue(node));
				} else if (Comment.TYPE.equalsIgnoreCase(node.getNodeName())) {
					comment.setType(getValue(node));
				} else if (Comment.STATUS.equalsIgnoreCase(node.getNodeName())) {
					comment.setStatus(getValue(node));
				} else if (Comment.CREATED.equalsIgnoreCase(node.getNodeName()))
					comment.setCreated(sdf.parse(getValue(node)));
				else if (Comment.ID.equalsIgnoreCase(node.getNodeName()))
					comment.setId(getValue(node));
				else if (Comment.OWNER_ID.equalsIgnoreCase(node.getNodeName()))
					comment.setOwnerId(getValue(node));
//				else if (Comment.DEPTH.equalsIgnoreCase(node.getNodeName()))
//					comment.setDepth(Short.parseShort(getValue(node)));
//				else if (Comment.ORDER.equalsIgnoreCase(node.getNodeName()))
//					comment.setOrder(Float.parseFloat(getValue(node)));
				else if (Comment.REPLY_TO.equalsIgnoreCase(node.getNodeName()))
					comment.setReplyTo(getValue(node));
				else if (Comment.EMAIL.equalsIgnoreCase(node.getNodeName()))
					comment.setEmail(getValue(node));
				else if (Comment.REOPEN_VERSION.equalsIgnoreCase(node
						.getNodeName()))
					comment.setReopenVersion(getValue(node));
			}
		}
		return comment;
	}

	protected static String getValue(Node node) {
		if (null == node)
			return "";

		NodeList children = node.getChildNodes();
		Node child;
		for (int i = 0; i < children.getLength(); i++) {
			child = children.item(i);
			if (child.getNodeType() == Node.TEXT_NODE)
				return deescapeXml(child.getNodeValue());
		}

		return "";
	}

	protected List<CommentFlag> unmarshallFlags(Node flagsNode) {
		List<CommentFlag> flagList = new LinkedList<CommentFlag>();
		if (null == flagsNode)
			return flagList;

		NodeList children = flagsNode.getChildNodes();
		Node node;
		CommentFlag flag;
		NamedNodeMap attriMap;
		for (int i = 0; i < children.getLength(); i++) {
			node = children.item(i);
			if (node.getNodeType() == Node.ELEMENT_NODE) {
				if (Comment.FLAG.equalsIgnoreCase(node.getNodeName())) {
					flag = new CommentFlag();
					attriMap = node.getAttributes();
					flag.setId(Integer.parseInt(attriMap.getNamedItem(
							CommentFlag.ID).getNodeValue()));
					flagList.add(flag);
				}
			}
		}

		return flagList;
	}

	public static String deescapeXml(String content) {
		if (null == content || content.length() == 0)
			return "";

		String rlt = content.replaceAll("&lt;", "<");
		rlt = rlt.replaceAll("&gt;", ">");
		rlt = rlt.replaceAll("&amp;", "&");
		rlt = rlt.replaceAll("&quot;", "\"");
		rlt = rlt.replaceAll("&apos;", "'");
		rlt = rlt.replaceAll("%2F", "/");
		return rlt;
	}

	/**
	 * If the file specified doesn't exist, create a new one with some initial
	 * content in it(with only root element). Or else, load the file from disk.
	 * 
	 * @param commentFile
	 *            Which file to be initialized.
	 * @return null if commentFile is null, otherwise the target file.
	 * @throws IOException
	 * @throws TransformerFactoryConfigurationError
	 * @throws TransformerException
	 * @throws ParserConfigurationException
	 * @throws SAXException
	 */
	public static Document initCommentsFile(File commentFile)
			throws IOException, TransformerFactoryConfigurationError,
			TransformerException, ParserConfigurationException, SAXException {
		if (null == commentFile)
			return null;
		File parent = commentFile.getParentFile();
		DocumentBuilderFactory builderFactory = DocumentBuilderFactory
				.newInstance();
		DocumentBuilder builder = builderFactory.newDocumentBuilder();

		if (!parent.exists())
			parent.mkdirs();
		if (!commentFile.exists()) {
			// If not exist, just create it.
			commentFile.createNewFile();
		} else {
			// If exist, parse it.
			return builder.parse(new FileInputStream(commentFile));
		}

		OutputStream os = null;
		try {
			Document document = builder.newDocument();
			document.setXmlVersion("1.0");

			// Create at least the root element, so that when the file is
			// loaded, there is no
			// parsing exception thrown.
			Node root = document.createElement("CommentsDocument");
			document.appendChild(root);
			Source source = new DOMSource(document);
			Result result = null;
			Transformer xformer = TransformerFactory.newInstance()
					.newTransformer();
			os = new FileOutputStream(commentFile);
			result = new StreamResult(os);
			xformer.transform(source, result);
			return document;
		} finally {
			if (null != os)
				os.close();
		}
	}

	/**
	 * Unit Test Driver
	 * 
	 * @param args
	 */
	public static void main(String[] args) {
		DavinciProject project = new DavinciProject();
		Unmarshaller unmarshaller = new Unmarshaller();
		CommentsDocument doc = unmarshaller.unmarshall(project);
		System.out.println(doc.getCommentList().size());
	}
}
